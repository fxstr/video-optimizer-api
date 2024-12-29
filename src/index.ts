import createServer from './createServer.js';

const port = 3000;
// 0.0.0.0 is required by fly.io
const host = '0.0.0.0';

const app = createServer();

app.listen(port, host, (): void => {
  console.log(`Server listening on ${host}, port ${port.toString()}`);
});
