import {
  S3Client,
  HeadObjectCommand,
  type HeadObjectCommandOutput,
} from '@aws-sdk/client-s3';
import type { Metadata } from '../types/Metadata.js';

export default class {
  #client: S3Client;

  #bucketName: string;

  constructor({
    endpoint,
    accessKeyId,
    secretAccessKey,
    bucketName,
  }: {
    endpoint: string,
    accessKeyId: string,
    secretAccessKey: string
    bucketName: string,
  }) {
    this.#client = new S3Client({
      // required but ignored by Tigris
      region: 'us-east-1',
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      // Required for Tigris
      forcePathStyle: true,
    });
    this.#bucketName = bucketName;
  }

  // Combine size, metadata and exists info in one call to reduce calls that take time
  async getFileMetadata(
    { fileName } : { fileName: string },
  ): Promise<{ size: number | undefined, metadata: Metadata, exists: boolean }> {
    const command = new HeadObjectCommand({
      Bucket: this.#bucketName,
      Key: fileName,
    });
    let response: HeadObjectCommandOutput;
    let exists = true;
    try {
      response = await this.#client.send(command);
    } catch (error) {
      if (error instanceof Error && error.name === 'NotFound') {
        exists = false;
      } else {
        throw error;
      }
    }
    console.log('Got S3 head response %o', response);
    return {
      size: exists && response.ContentLength,
      metadata: exists && response.Metadata as Metadata,
      exists,
    };
    // return { size, metadata, exists }
  }

  deleteFile(fileName)
  uploadFile(stream, fileName, metadata) {}
  streamFile(stream, range) {
    // Headers have already been set here
    // For Redis, wait until upload is done if range headers are there; if not, stream directly;
    // for S3, set Content-Length header (because we can and should); chunked for Redis stream?
    // Returns 
  }
};
