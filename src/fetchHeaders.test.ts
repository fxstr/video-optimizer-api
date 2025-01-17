import getHeaders from './fetchHeaders.js';
import fetchMock from 'fetch-mock';

test('returns headers', async () => {
  fetchMock
    .head('http://example.com', {
      status: 200,
      headers: {
        // Check different case
        'Content-Type': 'text/html',
      },
    });
  const headers = await getHeaders('http://example.com');
  expect(headers.get('content-type')).toBe('text/html');
});
