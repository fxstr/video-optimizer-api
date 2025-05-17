import { createClient } from 'redis';

const createRedisClient = () => {
  const client = createClient({
    url: 'redis://localhost:6379',
    // url: 'redis://default:a0bca70b1366437089fd412763713404@fly-temp-videos.upstash.io:6379',
  });
  
  client.on('error', err => console.log('Redis Client Error', err));
  return client.connect();
}

const doRedis = async () => {
  const client = await createRedisClient();
  for await (const key of client.scanIterator({
    MATCH: 'test',
  })) {
    console.log('got', key);
  }
  await client.del('test');
  await client.rPush('test', 'some data');
  console.log('Deleted key');
}

doRedis();
