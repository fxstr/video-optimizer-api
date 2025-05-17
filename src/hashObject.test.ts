import { hashObject } from './hashObject.js';

// https://emn178.github.io/online-tools/sha256.html
// Input is {"a":"b","c":"d"}
const abcdHash = 'b85c7da93e8790518898c280e15e3f1af5d46bf4aaa4407690f0f0a3b0316478';

describe('hash object', (): void => {
  test('hashes the object provided', (): void => {
    const input = {
      a: 'b',
      c: 'd',
    };
    expect(hashObject(input)).toBe(abcdHash);
  });

  test('sorts the keys', (): void => {
    const input = {
      c: 'd',
      a: 'b',
    };
    expect(hashObject(input)).toBe(abcdHash);
  });
});
