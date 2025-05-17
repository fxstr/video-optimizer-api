import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

/**
 * Fetches the relevant head information, in our case size and metadata
 */
export default async ({
  s3Client,
  bucketName,
  fileName,
}: {
  s3Client: S3Client,
  bucketName: string,
  fileName: string,
}): Promise<{ size: number | undefined, metadata?: Record<string, string> }> => {
  console.log('Get file size for %o in %o', fileName, bucketName);
  const command = new HeadObjectCommand({
    Bucket: bucketName,
    Key: fileName,
  });
  let response;
  try {
    response = await s3Client.send(command);
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFound') {
      console.log('File not found');
      return { size: undefined };
    }
    throw error;
  }
  console.log(response);
  return { size: response.ContentLength, metadata: response.Metadata };
};
