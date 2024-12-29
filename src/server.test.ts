import request from 'supertest';
import express from 'express';
import { Server } from 'http';
import createServer from './createServer.js';

let server: Server;

// Expose media directory for local testing (when we're in a TGV in France, e.g.)
beforeAll((): void => {
  const app = express();
  app.use('/media', express.static('media'));
  server = app.listen(3200);
});

afterAll((done): void => {
  server.close((): void => {
    done();
  });
});

/**
 * Test actual Express server
 */

test('fails on missing source', async (): Promise<void> => {
  const app = createServer();

  // Whatev, createServer or app do not return a Promise.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const response = await request(app)
    .get('/convert')
    .expect(400);
  expect(response.text.includes('"source"')).toBe(true);
});

test('works with valid arguments', (done): void => {
  const app = createServer();
  const chunks: Buffer[] = [];
  // Do not use a Promise here as the tes
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  request(app)
    .get('/convert?source=http://0.0.0.0:3200/media/test.mp4')
    .expect(200)
    .parse((response, callback):void => {
      response.on('data', (chunk: Buffer): void => { chunks.push(chunk); });
      response.on('end', (): void => { callback(null, Buffer.concat(chunks)); });
      response.on('error', callback as (error: Error) => void);
    })
    .then((response): void => {
      expect(response.headers['content-type']).toBe('video/mp4');
      done();
    })
    .catch((error: unknown): void => {
      console.error(error);
      throw error;
    });
}, 20000);
