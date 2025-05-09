import handleAsRangeRequest from './handleAsRangeRequest.js';

describe('range request', (): void => {
  test('returns the expected answer', (): void => {
    expect(handleAsRangeRequest('bytes=0-')).toBe(false);
    expect(handleAsRangeRequest('')).toBe(false);
    expect(handleAsRangeRequest(undefined)).toBe(false);
    expect(handleAsRangeRequest('bytes=0-10')).toBe(true);
    expect(handleAsRangeRequest('bytes=10-')).toBe(true);
  });
});
