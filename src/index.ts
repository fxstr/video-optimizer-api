import createServer from './createServer.js';

const port = parseInt(process.env.SERVER_PORT ?? '3000', 10);
// 0.0.0.0 is required by fly.io
const host = process.env.SERVER_HOST || '0.0.0.0';

const app = createServer();
console.log('Created server; listens on %s:%s', host, port.toString());

app.listen(port, host, (): void => {
  console.log(`Server listening on ${host}, port ${port.toString()}`);
});
