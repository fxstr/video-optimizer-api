import { Response } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { convertVideo, NormalizedParameters, OutputFormats } from 'video-optimizer';
import uploadFile from './s3/uploadFile.js';

export default async ({
  response,
  normalizedParameters,
  fileName,
  s3Client,
  bucketName,
  metadata,
}: {
  response: Response,
  normalizedParameters: NormalizedParameters
  fileName: string,
  s3Client: S3Client,
  bucketName: string,
  metadata: Record<string, string>,
}): Promise<void> => {
  const mimeTypeMapping: Record<OutputFormats, string> = {
    h264: 'video/mp4',
    av1: 'video/mp4',
    jpg: 'image/jpg',
  };
  const contentType = mimeTypeMapping[normalizedParameters.format];
  // Store mimeType in metadata as we need it for the content-type response header when
  // streaming from S3.
  const enhancedMetadata = { ...metadata, mimeType: contentType };
  console.log('Enhanced metadata is %o', enhancedMetadata);

  const errorCallback = (error: Error): void => {
    console.error(error);
    response.status(500).send('Could not convert video.');
    throw error;
  };
  let stream;
  try {
    const conversion = await convertVideo({
      ffmpegArguments: normalizedParameters,
      errorCallback,
    });
    stream = conversion.stream;
  } catch (error) {
    console.log('Conversion failed: %o', error);
    if (error instanceof Error) error.message = `Could not convert video: ${error.message}`;
    throw error;
  }
  await uploadFile({
    fileName,
    stream,
    s3Client,
    bucketName,
    metadata: enhancedMetadata,
  });
};
