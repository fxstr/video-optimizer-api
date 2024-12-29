import path from 'path';
import { PassThrough } from 'node:stream';
import convertVideo from './convertVideo';

const generateFFmpegArguments = (): string[] => (
  [
    '-i', path.join(__dirname, '../media/test.mp4'),
    // -f and --movflags are needed when we pipe the output
    '-f', 'mp4',
    '-movflags', '+frag_keyframe+empty_moov',
    '-', // Write to stdout
  ]
);

test('returns a promise', async ():Promise<void> => {
  // Without valid arguments, FFmpeg will fail
  const promise = convertVideo({ ffmpegArguments: generateFFmpegArguments() });
  expect(promise).toBeInstanceOf(Promise);
  const { cancel, stream } = await promise;
  // Always consume the stream or it will remain open
  stream.on('data', ():void => {});
  cancel();
  // Wait until everything was killed
  await new Promise<void>((resolve): void => { setTimeout(resolve, 1000); });
});

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
  cancel();
  // Wait a bit until process is killed and logs have been written; we can not log to after
  // a test has finished running.
  await new Promise<void>((resolve): void => { setTimeout(resolve, 1000); });
});

test('rejects with an invalid source', async (): Promise<void> => {
  const ffmpegArguments = [
    '-i', path.join(__dirname, '../media/tes.mp4'),
    '-f', 'mp4',
    '-movflags', '+frag_keyframe+empty_moov',
    '-', // Write to stdout
  ];
  const errorCallback = (error: Error): void => {
    expect(error.message.includes('No such file or directory')).toBe(true);
  };
  await expect(convertVideo({ ffmpegArguments, errorCallback })).rejects.toThrow();
});
