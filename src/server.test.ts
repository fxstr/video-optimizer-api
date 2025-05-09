import request from 'supertest';
import express from 'express';
import { Server } from 'http';
import createServer from './createServer.js';

let server: Server;

// Expose media directory for local testing (when we're in a TGV in France, e.g.)
beforeAll((): void => {
  const app = express();
  app.use('/media', express.static('media', {
    setHeaders: (res) => {
      res.set('Cache-Control', 'public, max-age: 123');
    },
  }));
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

test('exposes /vo endpoint', async (): Promise<void> => {
  const app = createServer();
  // Whatev, createServer or app do not return a Promise.
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const response = await request(app)
    .get('/vo')
    .expect(400);
  expect(response.text.includes('"source"')).toBe(true);
});

test('works with valid arguments', (done): void => {
  const app = createServer();
  const chunks: Buffer[] = [];
  // Do not use a Promise here as the tes
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  request(app)
    .get('/convert?source=http://0.0.0.0:3200/media/test.mp4&format=av1&size=/720&trim=00:00:01.000/00:00:02.000')
    .expect(200)
    .parse((response, callback):void => {
      response.on('data', (chunk: Buffer): void => { chunks.push(chunk); });
      response.on('end', (): void => { callback(null, Buffer.concat(chunks)); });
      response.on('error', callback as (error: Error) => void);
    })
    .then((response): void => {
      expect(response.headers['content-type']).toBe('video/mp4');
      expect(response.headers['content-range']).toBe(undefined);
      done();
    })
    .catch((error: unknown): void => {
      // eslint-disable-next-line no-console
      console.error(error);
      throw error;
    });
}, 20000);

test('provides docs', async (): Promise<void> => {
  const app = createServer();
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  await request(app)
    .get('/')
    .expect(200);
});

test('preserves cache headers', (done): void => {
  const app = createServer();
  const chunks: Buffer[] = [];
  request(app)
    .get('/convert?source=http://0.0.0.0:3200/media/test.mp4&trim00:00:01.000/00:00:01.200')
    .parse((response, callback):void => {
      // We must listen to the stream or it will not end
      response.on('data', (chunk: Buffer): void => { chunks.push(chunk); });
      response.on('end', (): void => { callback(null, Buffer.concat(chunks)); });
      response.on('error', callback as (error: Error) => void);
    })
    .expect(200)
    .then((response): void => {
      expect(response.headers['cache-control']).toEqual('public, max-age: 123');
    })
    .then(done)
    .catch((error: unknown): void => {
      // eslint-disable-next-line no-console
      console.error(error);
      throw error;
    });
}, 20000);

test('handles range requests correctly', (done): void => {
  const app = createServer();
  const chunks: Buffer[] = [];
  request(app)
    .get('/convert?source=http://0.0.0.0:3200/media/test.mp4&trim00:00:01.000/00:00:01.200')
    .set('Range', 'bytes=0-1')
    .parse((response, callback):void => {
      // We must listen to the stream or it will not end
      response.on('data', (chunk: Buffer): void => { chunks.push(chunk); });
      response.on('end', (): void => { callback(null, Buffer.concat(chunks)); });
      response.on('error', callback as (error: Error) => void);
    })
    .expect(206)
    .then((response): void => {
      expect(response.headers['content-range']).toMatch(/bytes 0-1\/\d+/);
    })
    .then(done)
    .catch((error: unknown): void => {
      // eslint-disable-next-line no-console
      console.error(error);
      throw error;
    });
}, 20000);
