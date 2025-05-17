import getResponseTTL from './getResponseTTL.js';

describe('get response ttl', (): void => {
  const now = Math.round(new Date().getTime() / 1000);

  test('requires public directive', (): void => {
    const input = 'private, max-age=100';
    expect(getResponseTTL(input)).toBe(now);
  });
  test('works with empty input', (): void => {
    const input = '';
    expect(getResponseTTL(input)).toBe(now);
  });
  test('prefers s-maxage', (): void => {
    const input = 'public, max-age=100, s-maxage=200';
    expect(getResponseTTL(input)).toBe(now + 200);
  });
  test('falls back to max-age', (): void => {
    const input = 'public, max-age=100';
    expect(getResponseTTL(input)).toBe(now + 100);
  });
  test('works with max-age 0', (): void => {
    const input = 'public, max-age=0';
    expect(getResponseTTL(input)).toBe(now);
  });
  test('ignores invald maxage value', (): void => {
    const input = 'public, max-age=test';
    expect(getResponseTTL(input)).toBe(now);
  });
  test('ignores invald directives', (): void => {
    const input = 'something here, public, max-age=100, maxage=50';
    expect(getResponseTTL(input)).toBe(now + 100);
  });
});
