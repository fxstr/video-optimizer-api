import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'node:stream';

export default async (
  {
    s3Client,
    bucketName,
    fileName,
    stream,
    metadata,
  }: {
    s3Client: S3Client,
    bucketName: string,
    fileName: string,
    stream: Readable,
    metadata: Record<string, string>,
  },
): Promise<void> => {
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: fileName,
      Body: stream,
      ContentType: metadata.contentType,
      Metadata: metadata,
    },
  });

  upload.on('httpUploadProgress', (progress): void => {
    console.log('Upload progress:', progress);
  });

  const result = await upload.done();
  console.log('UPLOADED', result);
};
