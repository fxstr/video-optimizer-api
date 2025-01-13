import path from 'path';
import { PassThrough } from 'node:stream';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import convertVideo from './convertVideo';

const currentDirectory = dirname(fileURLToPath(import.meta.url));

const generateFFmpegArguments = (): string[] => (
  [
    '-i', path.join(currentDirectory, '../media/test.mp4'),
    // -f and --movflags are needed when we pipe the output
    '-f', 'mp4',
    '-movflags', '+frag_keyframe+empty_moov',
    '-', // Write to stdout
  ]
);

// TODO: Input file that is not a video

test('returns a promise', async ():Promise<void> => {
  // Without valid arguments, FFmpeg will fail
  const promise = convertVideo({ ffmpegArguments: generateFFmpegArguments() });
  expect(promise).toBeInstanceOf(Promise);
  const { cancel, stream } = await promise;
  // Always consume the stream or it will remain open
  stream.on('data', ():void => {});
  await cancel();
}, 20000);

test('resolves with the expected params', async (): Promise<void> => {
  const ffmpegArguments = generateFFmpegArguments();
  const errorCallback = (error: Error): void => {
    console.error(error);
    // Make sure we fail here
    throw error;
  };
  const { stream, cancel } = await convertVideo({ ffmpegArguments, errorCallback });
  expect(stream).toBeInstanceOf(PassThrough);
  // We must consume the streams so that they are drained when the tests end
  stream.on('data', ():void => {});
  expect(typeof cancel).toBe('function');
  const cancelPromise = cancel();
  expect(cancelPromise).toBeInstanceOf(Promise);
  await cancelPromise;
}, 20000);

test('rejects with an invalid source', async (): Promise<void> => {
  const ffmpegArguments = [
    '-i', path.join(currentDirectory, '../media/tes.mp4'),
    '-f', 'mp4',
    '-movflags', '+frag_keyframe+empty_moov',
    '-', // Write to stdout
  ];
  const errorCallback = (error: Error): void => {
    expect(error.message.includes('No such file or directory')).toBe(true);
  };
  await expect(convertVideo({ ffmpegArguments, errorCallback })).rejects.toThrow();
});
