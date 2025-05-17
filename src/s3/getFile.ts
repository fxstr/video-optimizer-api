import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Writable, Readable } from 'node:stream';

export default async ({
  s3Client,
  bucketName,
  fileName,
  outStream,
  range,
}: {
  s3Client: S3Client,
  bucketName: string,
  fileName: string,
  outStream: Writable,
  range?: [number, number],
}): Promise<void> => {
  const rangeHeader = range ? { Range: `bytes=${range[0].toString()}-${range[1].toString()}` } : {};
  console.log('Range header for s3 is %o', range);
  const commandObject = {
    Bucket: bucketName,
    Key: fileName,
    ...rangeHeader,
  };
  const command = new GetObjectCommand(commandObject);
  const response = await s3Client.send(command);
  console.log('Response length is', response.ContentLength);
  const readableStream = response.Body as Readable;
  // readableStream.on('data', (chunk: Buffer): void => {
  //   console.log('chunk of length %d', chunk.length);
  // });
  readableStream.pipe(outStream);
};
