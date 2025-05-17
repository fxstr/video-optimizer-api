import parseRange from './parseRange.js';

describe('parse range', (): void => {
  test('throws on invalid range', (): void => {
    expect((): void => { parseRange('bits=-', 100); }).toThrow(/bytes=/);
    expect((): void => { parseRange('bytes=-', 100); }).toThrow(/start and\/or an end/);
    expect((): void => { parseRange('bytes=a-b', 100); }).toThrow(/contain a number/);
    expect((): void => { parseRange('bytes=-5-10', 100); }).toThrow(/contain one start/);
    expect((): void => { parseRange('bytes=20-10', 100); }).toThrow(/smaller than the end/);
    expect((): void => { parseRange('bytes=0-101', 100); }).toThrow(/smaller than the content length/);
  });

  test('returns the expected range', (): void => {
    expect(parseRange('bytes=0-10', 100)).toEqual([0, 10]);
    expect(parseRange('bytes=10-', 100)).toEqual([10, 99]);
    expect(parseRange('bytes=-10', 100)).toEqual([90, 99]);
    expect(parseRange('bytes=10-20', 100)).toEqual([10, 20]);
    expect(parseRange('bytes=10-10', 100)).toEqual([10, 10]);
  });
});
