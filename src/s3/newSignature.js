const mtadata = {
  mimeType: '…',
  originalURL: '…',
  apiKey: '…',
  expirationDate: '…',
};

createHeaders(contentType, range, contentLength, expiryDate) {
  // Cache-Control
  // Content-Length
  // Content-Range
  // Content-Type
}



// How to get correct Store? 
const useS3 = s3Store.getFileMetadata.exists;
const useRedis = !useS3 && redisStore.getFileMetadata.exists;
const store = useS3? s3Store : useRedis ? redisStore : undefined;

if (!store) {
  // Only await if range Header is set; if not: go straight for a stream from S3
  convert.pipe(useS3).pipe(useRedis);
}

setHeaders(response);
store.stream(response);



export default class {
  getFileMetadata(name) {
    return { size, metadata, exists }
  }
  uploadFile(stream, fileName, metadata) {}
  streamFile(stream, range) {
    // Headers have already been set here
    // For Redis, wait until upload is done if range headers are there; if not, stream directly;
    // for S3, set Content-Length header (because we can and should); chunked for Redis stream?
    // Returns 
  }
};
