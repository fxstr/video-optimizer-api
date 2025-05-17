import { S3Client } from '@aws-sdk/client-s3';
import type { OutgoingHttpHeaders } from 'http';
import type { Response } from 'express';
import getFile from './s3/getFile.js';

export default async ({
  range,
  response,
  fileName,
  fileSize,
  bucketName,
  s3Client,
  contentType,
}: {
  range?: [number, number]
  response: Response,
  fileName: string,
  fileSize: number,
  bucketName: string,
  s3Client: S3Client,
  contentType: string,
}): Promise<void> => {
  const [rangeStart, rangeEnd] = range ?? [];
  const responseStatus = range ? 206 : 200;
  const responseHeaders: OutgoingHttpHeaders = {
    'Content-Type': contentType,
    // TODO: Set to correct TTL; use 30 days for now
    'Cache-Control': 'public, max-age: 2592000',
  };
  if (rangeStart !== undefined && rangeEnd !== undefined) {
    responseHeaders['Content-Range'] = `bytes ${rangeStart.toString()}-${rangeEnd.toString()}/${fileSize.toString()}`;
    // Express will set Transfer-Encoding: chunked if the Content-Length header is not present;
    // that fucks up Safari. Set it to prevent that.
    responseHeaders['Content-Length'] = rangeEnd - rangeStart + 1;
  } else {
    responseHeaders['Content-Length'] = fileSize;
  }
  console.log('Response headers are %o', responseHeaders);
  response.writeHead(responseStatus, responseHeaders);

  await getFile({
    fileName,
    outStream: response,
    range: rangeStart !== undefined && rangeEnd !== undefined ? [rangeStart, rangeEnd] : undefined,
    s3Client,
    bucketName,
  });
};
