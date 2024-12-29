import express, { Application } from 'express';
import convertVideo from './convertVideo.js';
import generateFFmpegArguments from './generateFFmpegArguments.js';
import QueryParameterError from './QueryParameterError.js';
import provideDocumentation from './provideDocumentation.js';

/**
 * Creates and exports the server; export the non-listening express server in order to use
 * SuperTest.
 */
export default (): Application => {
  const app: Application = express();

  app.get('/convert', async (request, response): Promise<void> => {
    console.log('Got GET request to /convert');
    console.log('Query is %o', request.query);

    let ffmpegArguments: string[] = [];
    let fileType: string = '';
    try {
      const generatedArguments = generateFFmpegArguments(request.query); 
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
      const { cancel, stream } = await convertVideo({ ffmpegArguments, errorCallback });
      const mimeTypes: { [key: string]: string } = {
        mp4: 'video/mp4',
        jpg: 'image/jpeg',
      };
      // Use default text/plain because it's best to send an error
      const mimeType = mimeTypes[fileType] || 'text/plain';
      response.setHeader('Content-Type', mimeType);
      response.on('close', cancel);
      stream.pipe(response);
    } catch (error) {
      response.setHeader('Content-Type', 'text/plain');
      const status = error instanceof QueryParameterError ? 400 : 500;
      const responsePayload = error instanceof Error ? error.message : 'Unknown error';
      response.status(status).send(responsePayload);
    }
  });

  // Provide a video for local testing
  app.use('/media', express.static('media'));
  app.use('/styles', express.static('styles'));

  // Provide documentation; fail gracefully as docs are not crucial
  try {
    app.get('', async (_, response): Promise<void> => {
      response.setHeader('Content-Type', 'text/html');
      const docs = await provideDocumentation();
      response.send(docs);
    });
  } catch (error) {
    console.error(error);
  }

  return app;
};
