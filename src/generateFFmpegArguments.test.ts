import generateFFmpegArguments from './generateFFmpegArguments.js';
import QueryParameterError from './QueryParameterError.js';

test('throws on missing or invalid source parameter', (): void => {
  // Throws on missing source
  expect((): void => {
    generateFFmpegArguments({});
  }).toThrow();

  // Returns correct error if source is missing
  try {
    generateFFmpegArguments({});
  } catch (error) {
    // We must throw here in order to access .message below safely
    if (!(error instanceof QueryParameterError)) throw new Error('Expected error not thrown');
    expect(error.message.includes('source')).toBe(true);
  }

  // Throws on invalid source protocol (e.g. ftp)
  try {
    generateFFmpegArguments({ source: 'ftp://fxstr.com/video.mp4' });
    throw new Error('Expected error not thrown');
  } catch (error) {
    // We must throw here in order to access .message below safely
    if (!(error instanceof QueryParameterError)) throw new Error('Error has an unexpected type');
    expect(error.message.includes('https://')).toBe(true);
  }
});

test('returns the expected arguments if called without format', (): void => {
  const ffmpegArguments = generateFFmpegArguments({
    source: 'https://fxstr.com/video.mp4',
  });
  expect(ffmpegArguments).toEqual({
    ffmpegArguments: [
      '-i', 'https://fxstr.com/video.mp4',
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      '-v', 'verbose',
      '-',
    ],
    fileType: 'mp4',
  });
});

test('returns the expected arguments for av1', (): void => {
  const ffmpegArguments = generateFFmpegArguments({
    source: 'https://fxstr.com/video.mp4',
    format: 'av1',
  });
  expect(ffmpegArguments).toEqual({
    ffmpegArguments: [
      '-i', 'https://fxstr.com/video.mp4',
      '-c:v', 'libsvtav1',
      '-crf', '20',
      '-f', 'mp4',
      '-movflags', 'frag_keyframe+empty_moov',
      '-v', 'verbose',
      '-',
    ],
    fileType: 'mp4',
  });
});

test('returns the expected arguments for jpg', (): void => {
  const ffmpegArguments = generateFFmpegArguments({
    source: 'https://fxstr.com/video.mp4',
    format: 'jpg',
  });
  expect(ffmpegArguments).toEqual({
    ffmpegArguments: [
      '-i', 'https://fxstr.com/video.mp4',
      '-vframes', '1',
      '-f', 'image2',
      '-vcodec', 'mjpeg',
      '-v', 'verbose',
      '-',
    ],
    fileType: 'jpg',
  });
});

test('throws on invalid size', (): void => {
  let allFine = true;
  try {
    generateFFmpegArguments({
      source: 'https://fxstr.com/video.mp4',
      size: '2/2',
    });
    // Line should not have been reached, error should have been thrown
    allFine = false;
  } catch (error) {
    if (!(error instanceof QueryParameterError)) throw new Error('Type of size error must be QueryParameterError');
    expect(error.message.includes('either be a number')).toBe(true);
  }
  if (!allFine) throw new Error('Expected error was not thrown');
});

test('returns valid size (width)', (): void => {
  const { ffmpegArguments } = generateFFmpegArguments({
    source: 'https://fxstr.com/video.mp4',
    size: '240',
  });
  const vfIndex = ffmpegArguments.indexOf('-vf');
  expect(ffmpegArguments[vfIndex + 1]).toBe('scale=240:trunc(ow/a/2)*2');
});

test('returns valid size (height)', (): void => {
  const { ffmpegArguments } = generateFFmpegArguments({
    source: 'https://fxstr.com/video.mp4',
    size: '/180',
  });
  const vfIndex = ffmpegArguments.indexOf('-vf');
  expect(ffmpegArguments[vfIndex + 1]).toBe('scale=trunc(oh*a/2)*2:180');
});

describe('handles trim', (): void => {
  test('fails on invalid trim', (): void => {
    let allFine: boolean = true;
    try {
      generateFFmpegArguments({
        source: 'https://fxstr.com/video.mp4',
        trim: 'invalidTime',
      });
      allFine = false;
    } catch (error) {
      if (!(error instanceof QueryParameterError)) {
        throw new Error('Error for trim is not of type QueryParameterError');
      }
      expect(error.message.includes('hh:mm:ss.sss')).toBe(true);
    }
    if (!allFine) {
      throw new Error('Expected error for trim not thrown');
    }
  });

  test('returns valid trim (from)', (): void => {
    const { ffmpegArguments } = generateFFmpegArguments({
      source: 'https://fxstr.com/video.mp4',
      trim: '00:00:02.12',
    });
    const ssIndex = ffmpegArguments.indexOf('-ss');
    expect(ffmpegArguments[ssIndex + 1]).toBe('2.012');
  });

  test('returns valid trim (to)', (): void => {
    const { ffmpegArguments } = generateFFmpegArguments({
      source: 'https://fxstr.com/video.mp4',
      trim: '/00:00:02.12',
    });
    const tIndex = ffmpegArguments.indexOf('-t');
    expect(ffmpegArguments[tIndex + 1]).toBe('2.012');
  });

  test('returns valid trim (from and to)', (): void => {
    const { ffmpegArguments } = generateFFmpegArguments({
      source: 'https://fxstr.com/video.mp4',
      trim: '00:00:02.10/00:00:03.12',
    });
    const ssIndex = ffmpegArguments.indexOf('-ss');
    expect(ffmpegArguments[ssIndex + 1]).toBe('2.010');
    expect(ffmpegArguments[ssIndex + 2]).toBe('-t');
    expect(ffmpegArguments[ssIndex + 3]).toBe('1.002');
  });
});
