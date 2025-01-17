import { Response, Request } from 'express';
import convertVideo from './convertVideo.js';
import generateFFmpegArguments from './generateFFmpegArguments.js';
import QueryParameterError from './QueryParameterError.js';
import normalizeParameters from './normalizeParameters.js';
import fetchHeaders from './fetchHeaders.js'

export default async (request: Request, response: Response): Promise<void> => {
  let ffmpegArguments: string[] = [];
  let fileType: string = '';
  let normalizedParameters;
  try {
    normalizedParameters = normalizeParameters(request.query);
    const generatedArguments = generateFFmpegArguments(normalizedParameters);
    ffmpegArguments = generatedArguments.ffmpegArguments;
    fileType = generatedArguments.fileType;
  } catch (error) {
    // Known error: Handle it accordingly
    if (error instanceof QueryParameterError) {
      response.setHeader('Content-Type', 'text/plain');
      response.status(400).send(error.message);
      return;
    }
    // Unknown error: Throw it
    throw error;
  }

  // TODO: If there's a hash for a video and it is being transcoded currently, don't
  // start a new process, but just pipe it through (Will that work? Might fail because
  // streams don't preserve old data; we'd probably have to store and take it from the
  // hard disk)

  const errorCallback = (error: Error): void => {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    response.send(message);
  };

  try {
    const videoConversionPromise = await convertVideo({ ffmpegArguments, errorCallback });
    const headerPromise = normalizedParameters.source
      ? fetchHeaders(normalizedParameters.source)
      : Promise.resolve(new Headers());

    const [
      { cancel, stream },
      originalHeaders
    ] = await Promise.all([videoConversionPromise, headerPromise]);
    
    const mimeTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      jpg: 'image/jpeg',
    };
    // Use default text/plain because it's best to send an error
    const mimeType = mimeTypes[fileType] || 'text/plain';
    response.setHeader('Content-Type', mimeType);
    const originalCacheHeader = originalHeaders.get('cache-control');
    if (originalCacheHeader) response.setHeader('Cache-Control', originalCacheHeader);
    response.on('close', () => cancel());
    stream.pipe(response);
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain');
    const status = error instanceof QueryParameterError ? 400 : 500;
    const responsePayload = error instanceof Error ? error.message : 'Unknown error';
    response.status(status).send(responsePayload);
  }
};
