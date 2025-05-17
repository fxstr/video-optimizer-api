const s3 = new S3Client({
  region: 'us-east-1', // required but ignored by Bunny
  endpoint: process.env.S3_ENDPOINT, // or your Bunny storage region
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
  // Required for Bunny
  forcePathStyle: true,
});

const getFile = async () => {
  const command = new GetObjectCommand({
    Bucket: 'video-optimizer-staging',
    Key: 'example.txt',
  });

  const response = await s3.send(command);
  response.Body.on('data', (chunk) => {
    console.log(chunk.toString());
  });
};

getFile().catch(console.error);

const uploadFile = async () => {
  const command = new PutObjectCommand({
    Bucket: 'video-optimizer-staging',
    Key: 'example.txt',
    Body: 'Hello Bunny!',
  });

  await s3.send(command);
  console.log('done');
};

uploadFile().catch(console.error);