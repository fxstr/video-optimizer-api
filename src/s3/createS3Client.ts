import { S3Client } from '@aws-sdk/client-s3';

export default ({
  s3Endpoint,
  s3AccessKey,
  s3SecretAccessKey,
}: {
  s3Endpoint: string,
  s3AccessKey: string,
  s3SecretAccessKey: string
}): S3Client => {
  console.log('Create S3 client on endpoint %s', s3Endpoint);

  return new S3Client({
    // required but ignored by Tigris
    region: 'us-east-1',
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId: s3AccessKey,
      secretAccessKey: s3SecretAccessKey,
    },
    // Required for Tigris
    forcePathStyle: true,
  });
};
