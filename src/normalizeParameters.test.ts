import type { NormalizedParameters } from 'video-optimizer';
import normalizeParameters from './normalizeParameters.js';
import QueryParameterError from './QueryParameterError.js';

const createDefaultParameters = (): { source: string } => ({
  source: 'https://example.com/video.mp4',
});

describe('handles sources', (): void => {
  test('throws on missing source', (): void => {
    expect((): void => { normalizeParameters({}); }).toThrow();
    try {
      normalizeParameters({});
    } catch (error) {
      expect(error instanceof QueryParameterError).toBe(true);
    }
  });

  test('normalizes source', (): void => {
    const source = 'https://example.com/video.mp4';
    const normalizedParameters = normalizeParameters({ source });
    expect(normalizedParameters.source).toBe(source);
  });

  test('throws on invalid source protocol (e.g. ftp)', (): void => {
    expect((): void => {
      normalizeParameters({ source: 'ftp://example.com/video.mp4' });
    }).toThrow();
  });
});

describe('size', (): void => {
  test('throws on invalid width', (): void => {
    expect((): void => {
      normalizeParameters({ ...createDefaultParameters(), size: 'abc' });
    }).toThrow('size (width)');
  });
  test('extracts width and height', (): void => {
    const { height, width } = normalizeParameters({ ...createDefaultParameters(), size: '3/4' });
    expect(height).toBe(4);
    expect(width).toBe(3);
  });
  test('extracts width', (): void => {
    const { height, width } = normalizeParameters({ ...createDefaultParameters(), size: '3' });
    expect(height).toBe(null);
    expect(width).toBe(3);
  });
  test('accepts trailing / for width', (): void => {
    const { width } = normalizeParameters({ ...createDefaultParameters(), size: '3/' });
    expect(width).toBe(3);
  });
  test('accepts floats, returns integers', (): void => {
    const { width } = normalizeParameters({ ...createDefaultParameters(), size: '3.32' });
    expect(width).toBe(3);
  });
  test('extracts height', (): void => {
    const { height, width } = normalizeParameters({ ...createDefaultParameters(), size: '/4' });
    expect(height).toBe(4);
    expect(width).toBe(null);
  });
});

describe('format', (): void => {
  test('throws on invalid format', (): void => {
    const params = { ...createDefaultParameters(), format: 'unknown' };
    expect((): NormalizedParameters => normalizeParameters(params)).toThrow();
  });

  test('defaults to h264', (): void => {
    const params = { ...createDefaultParameters(), format: undefined };
    expect(normalizeParameters(params).format).toBe('h264');
  });

  test('accepts valid input formats', (): void => {
    const params = { ...createDefaultParameters(), format: 'jpg' };
    expect(normalizeParameters(params).format).toBe('jpg');
  });
});

describe('trim', (): void => {
  test('throws on invalid time', (): void => {
    // Exact hh:mm:ss.sss format is needed
    const params = { ...createDefaultParameters(), trim: '123' };
    expect((): NormalizedParameters => normalizeParameters(params)).toThrow();
  });

  test('extracts from', (): void => {
    const { trimStartMs } = normalizeParameters(
      { ...createDefaultParameters(), trim: '123:31:01.341/' },
    );
    expect(trimStartMs).toBe(444661341);
  });

  test('extracts to', (): void => {
    const { trimEndMs } = normalizeParameters(
      { ...createDefaultParameters(), trim: '/123:31:01.341' },
    );
    expect(trimEndMs).toBe(444661341);
  });

  test('extracts from and to', (): void => {
    const { trimEndMs, trimStartMs } = normalizeParameters(
      { ...createDefaultParameters(), trim: '123:31:01.340/123:31:01.341' },
    );
    expect(trimStartMs).toBe(444661340);
    expect(trimEndMs).toBe(444661341);
  });

  test('throws if end is before start', (): void => {
    const params = { ...createDefaultParameters(), trim: '123:31:01.341/123:31:01.340' };
    expect((): NormalizedParameters => normalizeParameters(params)).toThrow();
  });
});

describe('fps', (): void => {
  test('throws on invalid fps', (): void => {
    expect((): NormalizedParameters => (
      normalizeParameters({ ...createDefaultParameters(), fps: 'abc' })
    )).toThrow('fps');
  });
  test('extracts fps', (): void => {
    const { fps } = normalizeParameters({ ...createDefaultParameters(), fps: '29.97' });
    expect(fps).toBe(29.97);
  });
});

describe('quality', (): void => {
  test('throws on invalid quality', (): void => {
    expect((): NormalizedParameters => (
      normalizeParameters({ ...createDefaultParameters(), quality: 'abc' })
    )).toThrow('quality');
    // Out of bounds
    expect((): NormalizedParameters => (
      normalizeParameters({ ...createDefaultParameters(), quality: '-1' })
    )).toThrow('quality');
    expect((): NormalizedParameters => (
      normalizeParameters({ ...createDefaultParameters(), quality: '101' })
    )).toThrow('quality');
  });
  test('extracts quality', (): void => {
    const { quality } = normalizeParameters({ ...createDefaultParameters(), quality: '99' });
    expect(quality).toBe(99);
  });
  test('rounds quality', (): void => {
    const { quality } = normalizeParameters({ ...createDefaultParameters(), quality: '99.2' });
    expect(quality).toBe(99);
  });
});

describe('keyframes', (): void => {
  test('throws on invalid keyframe', (): void => {
    expect((): NormalizedParameters => (
      normalizeParameters({ ...createDefaultParameters(), keyframe: 'abc' })
    )).toThrow('keyframe');
    // Out of bounds
    expect((): NormalizedParameters => (
      normalizeParameters({ ...createDefaultParameters(), keyframe: '-1' })
    )).toThrow('keyframe');
  });
  test('extracts keyframe', (): void => {
    const { keyframeInterval } = normalizeParameters({ ...createDefaultParameters(), keyframe: '99' });
    expect(keyframeInterval).toBe(99);
  });
  test('rounds quality', (): void => {
    const { keyframeInterval } = normalizeParameters({ ...createDefaultParameters(), keyframe: '99.2' });
    expect(keyframeInterval).toBe(99);
  });
});
