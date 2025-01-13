import generateFFmpegArguments from './generateFFmpegArguments.js';
import { NormalizedParameters } from './types/NormalizedParameters.js';

const generateDefaultParameters = (): NormalizedParameters => ({
  source: 'https://example.com/video.mp4',
  format: null,
  width: null,
  height: null,
  trimStartMs: null,
  trimEndMs: null,
  fps: null,
  quality: null,
});

describe('format', (): void => {
  test('returns the expected arguments if called without format', (): void => {
    const ffmpegArguments = generateFFmpegArguments(generateDefaultParameters());
    expect(ffmpegArguments).toEqual({
      ffmpegArguments: [
        '-i', 'https://example.com/video.mp4',
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
    const params = { ...generateDefaultParameters(), format: 'av1' };
    const ffmpegArguments = generateFFmpegArguments(params);
    expect(ffmpegArguments).toEqual({
      ffmpegArguments: [
        '-i', 'https://example.com/video.mp4',
        '-c:v', 'libsvtav1',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov',
        '-v', 'verbose',
        '-',
      ],
      fileType: 'mp4',
    });
  });

  test('returns the expected arguments for jpg', (): void => {
    const params = { ...generateDefaultParameters(), format: 'jpg' };
    const ffmpegArguments = generateFFmpegArguments(params);
    expect(ffmpegArguments).toEqual({
      ffmpegArguments: [
        '-i', 'https://example.com/video.mp4',
        '-vframes', '1',
        '-f', 'image2',
        '-vcodec', 'mjpeg',
        '-v', 'verbose',
        '-',
      ],
      fileType: 'jpg',
    });
  });
});

describe('size', (): void => {
  test('returns valid size (width)', (): void => {
    const params = { ...generateDefaultParameters(), width: 240 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const vfIndex = ffmpegArguments.indexOf('-vf');
    expect(ffmpegArguments[vfIndex + 1]).toBe('scale=240:trunc(ow/a/2)*2');
  });

  test('returns valid size (height)', (): void => {
    const params = { ...generateDefaultParameters(), height: 180 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const vfIndex = ffmpegArguments.indexOf('-vf');
    expect(ffmpegArguments[vfIndex + 1]).toBe('scale=trunc(oh*a/2)*2:180');
  });

  test('returns valid size (width and height)', (): void => {
    const params = { ...generateDefaultParameters(), height: 180, width: 200 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const vfIndex = ffmpegArguments.indexOf('-vf');
    expect(ffmpegArguments[vfIndex + 1])
      .toBe('scale=\'if(gt(a,200/180),-1,200)\':\'if(gt(a,200/180),180,-1)\',crop=200:180');
  });

  test('returns no size (no width and no height', (): void => {
    const params = { ...generateDefaultParameters() };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    expect(ffmpegArguments.includes('vf')).toBe(false);
  });
});

describe('handles trim', (): void => {
  test('returns trim (from)', (): void => {
    const params = { ...generateDefaultParameters(), trimStartMs: 2012 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const ssIndex = ffmpegArguments.indexOf('-ss');
    expect(ffmpegArguments[ssIndex + 1]).toBe('2.012');
  });

  test('returns valid trim (to)', (): void => {
    const params = { ...generateDefaultParameters(), trimEndMs: 2012 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const tIndex = ffmpegArguments.indexOf('-t');
    expect(ffmpegArguments[tIndex + 1]).toBe('2.012');
  });

  test('returns valid trim (from and to)', (): void => {
    const params = { ...generateDefaultParameters(), trimStartMs: 2010, trimEndMs: 3012 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const ssIndex = ffmpegArguments.indexOf('-ss');
    expect(ffmpegArguments[ssIndex + 1]).toBe('2.010');
    expect(ffmpegArguments[ssIndex + 2]).toBe('-t');
    expect(ffmpegArguments[ssIndex + 3]).toBe('1.002');
  });

  test('returns no trim if not set', (): void => {
    const params = { ...generateDefaultParameters() };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    expect(ffmpegArguments.includes('-ss')).toBe(false);
    expect(ffmpegArguments.includes('-t')).toBe(false);
  });
});

describe('handles fps', (): void => {
  test('returns fps', (): void => {
    const params = { ...generateDefaultParameters(), fps: 30 };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    const rIndex = ffmpegArguments.indexOf('-r');
    expect(ffmpegArguments[rIndex + 1]).toBe('30');
  });

  test('returns no fps if not set', (): void => {
    const params = { ...generateDefaultParameters() };
    const { ffmpegArguments } = generateFFmpegArguments(params);
    expect(ffmpegArguments.includes('-r')).toBe(false);
  });
});
