import { S3Client } from '@aws-sdk/client-s3';
import { Response, Request } from 'express';
import normalizeParameters from './normalizeParameters.js';
import { hashObject, HashableObject } from './hashObject.js';
import getAndValidateEnvVars from './getAndValidateEnvVars.js';
import getHead from './s3/getHead.js';
import streamFromS3 from './streamFromS3.js';
import convertAndStoreVideo from './convertAndStoreVideo.js';
import parseRange from './parseRange.js';
import getResponseTTL from './getResponseTTL.js';

/**
 * Converts the video. We pass in response and request because:
 * - In case of errors, we need to send text; in case of video: mp4 and with images: jpg.
 * - We can pipe the ffmpeg output directly to the response.
 */
export default async ({
  request,
  response,
  s3Client,
}: {
  request: Request,
  response: Response,
  s3Client: S3Client,
}): Promise<void> => {
  let normalizedParameters;
  try {
    normalizedParameters = normalizeParameters(request.query);
  } catch (error) {
    // Sending the error *message* (not the whole error that might include the stack) is safe here
    // because we designed it to be user-exposable.
    const message = error instanceof Error ? error.message : error;
    response.status(400).send(message);
    return;
  }

  console.log('Params are %o', normalizedParameters);

  const hash = hashObject(normalizedParameters as HashableObject);
  console.log('Hash is %s', hash);

  const [s3BucketName] = getAndValidateEnvVars('S3_BUCKET_NAME');

  // Get the file size on S3; if is not undefined and > 0, there's a file we can stream
  let fileSize: number | undefined;
  let metadata: Record<string, string> = {};
  try {
    const head = await getHead({ s3Client, bucketName: s3BucketName, fileName: hash });
    fileSize = head.size;
    if (head.metadata) metadata = head.metadata;
  } catch (error) {
    response.status(500).send('Could not get file size from storage.');
    return;
  }

  // File has no size or is not valid: Convert the video, store it to S3
  if (!fileSize || Number.isNaN(fileSize)) {
    const newMetadata: Record<string, string> = {
      orignalURL: normalizedParameters.source,
      // S3 metadata must be strings; therefore, convert our number to string
      expirationDate: getResponseTTL(request.headers['cache-control'] || '').toString(),
    };
    // Continue gracefully if apiKey is missing or invalid
    const apiKey = request.query['api-key'];
    if (typeof apiKey === 'string') {
      newMetadata.apiKey = apiKey;
    } else {
      console.error('API key is missing or invalid in query %o', request.query);
    }

    console.log('File does not yet exist: convert and store video.');
    try {
      await convertAndStoreVideo({
        response,
        normalizedParameters,
        fileName: hash,
        bucketName: s3BucketName,
        s3Client,
        metadata: newMetadata,
      });
    } catch (error) {
      response.status(500).send(error);
      return;
    }

    try {
      // Get adjusted file size (after upload)
      const head = await getHead({ s3Client, bucketName: s3BucketName, fileName: hash });
      fileSize = head.size;
      if (head.metadata) metadata = head.metadata;
      // File size is 0 or undefined (does not exist): That's not a valid option here, throw
      if (!fileSize) throw new Error('File size after conversion is 0');
    } catch (error) {
      console.error(error);
      response.status(500).send('Video or file size could not be fetched after conversion.');
      return;
    }
  }

  const range = request.headers.range ? parseRange(request.headers.range, fileSize) : undefined;
  console.log('Range parsed from header is %o, original %s', range, request.headers.range);

  // Fall back gracefully
  let contentType;
  console.log('Metadata returned is', metadata);
  if (metadata.mimetype) contentType = metadata.mimetype;
  else contentType = 'video/mp4';

  console.log('File found; stream from s3. Content type is %s', contentType);
  await streamFromS3({
    range,
    response,
    fileName: hash,
    fileSize,
    bucketName: s3BucketName,
    s3Client,
    contentType,
  });
};
