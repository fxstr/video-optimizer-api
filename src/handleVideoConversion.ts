import { Response, Request } from 'express';
import convertVideo from './convertVideo.js';
import generateFFmpegArguments from './generateFFmpegArguments.js';
import QueryParameterError from './QueryParameterError.js';
import normalizeParameters from './normalizeParameters.js';
import fetchHeaders from './fetchHeaders.js';
import extractRangeHeaders from 'range-parser';
import handleAsRangeRequest from './handleAsRangeRequest.js';

/**
 * Converts the video. We pass in response and request because:
 * - In case of errors, we need to send text; in case of video: mp4 and with images: jpg.
 * - We can pipe the ffmpeg output directly to the response.
 */
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

    // Get (or create) the source's headers to forward its Cache-Control instructions
    const headerPromise = normalizedParameters.source
      ? fetchHeaders(normalizedParameters.source)
      : Promise.resolve(new Headers());

    // Get the headers *while* we convert the video (in parallel to speed things up)
    const [
      { cancel, stream },
      originalHeaders,
    ] = await Promise.all([videoConversionPromise, headerPromise]);

    const mimeTypes: { [key: string]: string } = {
      mp4: 'video/mp4',
      jpg: 'image/jpeg',
    };
    // Use default text/plain because it's best to send an error
    const mimeType = mimeTypes[fileType] || 'text/plain';

    // Save resources: Cancel ffmpeg when the response is closed (which happens a lot e.g. on
    // Chrome that just fetches a tiny bit of the video – and then requests the whole video a
    // frew moments later)
    // Complex syntax because cancel() is async (returns a Promise) and TS wants a void return
    response.on('close', (): void => {
      cancel().catch((): void => { /* ignore error */ });
    });

    // So. This gets a bit complicated. Safari.
    // When requesting an AV1 video (which Safari supports from M3 processors on), it sends a
    // range header (on the first request: bytes=0-1; on later requests: subsequent ranges).
    // If we just return the whole (streaming) video with a 200 status code, Safari will fail
    // to display it.
    //
    // Problem:
    // 1. In order to fulfill the request to Safari's desires, we have to return a 206 status
    //    code (and a Content-Range header).
    // 2. The Content-Range header must include the response's total size (e.g.
    //    Content-Range: bytes 0-23/80).
    // 3. Especially if using VBR, we only know the response size *after* the whole video has been
    //    converted.
    //
    // Solution:
    // 1. If no range header is set on the request, just stream ffmpeg's output to the response;
    //    that is *much* faster (and preserves so much more memory) than converting the whole
    //    video and *only then* respond with it.
    // 2. If a range header is set, convert the whole video first (🤷‍♂️) to get its size. Only
    //    then respond with the range requested. If the range is invalid, return 416 status code.
    //
    // BTW: The range "bytes=0-" is fine with a 200 status; handle it as a regular request.
    // TODO: Implementation is heavily tied to request and response and the stream; therefore
    // it's hard to encapsulate it. Do it if the file grows in the future.
    const rangeHeader = request.headers.range;
    if (rangeHeader && handleAsRangeRequest(rangeHeader)) {
      console.log('Request includes a range header, handle it with status 206: %s', rangeHeader);
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer): void => { chunks.push(chunk); });
      stream.on('end', (): void => {
        const result = Buffer.concat(chunks);
        const parsedRanges = extractRangeHeaders(result.length, rangeHeader);
        // -1 is unsatisfiable, -2 is invalid: https://www.npmjs.com/package/range-parser
        // Return error on multirange requests: They're rare and complex to handle.
        if (parsedRanges === -1 || parsedRanges === -2 || parsedRanges.length !== 1) {
          response.status(416).send('Requested Range Not Satisfiable: Expected exactly one range');
          return;
        }
        // If rangeEnd (which is optional) is not set, use the content's length (minus 1, as
        // range is inclusive)
        const [{ start: rangeStart, end: rangeEnd = result.length - 1 }] = parsedRanges;
        const chunkSize = rangeEnd - rangeStart + 1;
        console.log('Parsed ranges are: %d/%d; chunk size is %d', rangeStart, rangeEnd, chunkSize);
        response.writeHead(206, {
          'Content-Range': `bytes ${rangeStart.toString()}-${rangeEnd.toString()}/${result.length.toString()}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
        });
        // Only return the (exact) data requested in range header
        const dataToReturn = result.subarray(rangeStart, rangeEnd + 1);
        console.log('Return %d bytes of data', dataToReturn.length);
        response.end(dataToReturn);
      });
      stream.on('error', console.error);
    } else {
      console.log('Regular (non-range) request; set content type to %s', mimeType);
      response.setHeader('Content-Type', mimeType);
      const originalCacheHeader = originalHeaders.get('cache-control');
      if (originalCacheHeader) response.setHeader('Cache-Control', originalCacheHeader);
      console.log('Start streaming');
      stream.pipe(response);
    }
  } catch (error) {
    response.setHeader('Content-Type', 'text/plain');
    const status = error instanceof QueryParameterError ? 400 : 500;
    const responsePayload = error instanceof Error ? error.message : 'Unknown error';
    response.status(status).send(responsePayload);
  }
};
