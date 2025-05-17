import express, { Application } from 'express';
import provideDocumentation from './provideDocumentation.js';
import handleVideoConversion from './handleVideoConversion.js';
import createS3Client from './s3/createS3Client.js';
import getAndValidateEnvVars from './getAndValidateEnvVars.js';

/**
 * Creates and exports the server; export the non-listening express server in order to use
 * SuperTest.
 */
export default (): Application => {
  const app: Application = express();
  app.disable('x-powered-by');

  // Init client outside of a request to share it among different requests
  const [s3Endpoint, s3AccessKey, s3SecretAccessKey] = getAndValidateEnvVars(
    'S3_ENDPOINT',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
  );
  const s3Client = createS3Client({ s3Endpoint, s3AccessKey, s3SecretAccessKey });

  app.get('/', (request, response): Promise<void> => handleVideoConversion({
    response,
    request,
    s3Client,
  }));

  // Provide a video for local testing
  app.use('/media', express.static('media'));

  app.get('/docs', async (_, response): Promise<void> => {
    // Provide documentation; fail gracefully as docs are not crucial
    try {
      response.setHeader('Content-Type', 'text/html');
      const docs = await provideDocumentation();
      response.send(docs);
    } catch (error) {
      console.error(error);
      response.status(500).send('Documentation could not be loaded.');
    }
  });
  // Styles for the docs
  app.use('/styles', express.static('styles'));

  return app;
};
