import hashQueryString from './hashQueryString.js';

// https://emn178.github.io/online-tools/sha256.html: Input is "a=b&c=d"
const abcdToken = '703820ccaccb60bb7a1563d6e6736bcc261c8c061f8d8896103cccf6bfe41e33';

describe('hash query string', (): void => {
  test('hashes the query string provided', (): void => {
    const qs = {
      a: 'b',
      c: 'd',
    };
    expect(hashQueryString(qs)).toBe(abcdToken);
  });

  test('sorts the keys', (): void => {
    const qs = {
      c: 'd',
      a: 'b',
    };
    expect(hashQueryString(qs)).toBe(abcdToken);
  });
});
