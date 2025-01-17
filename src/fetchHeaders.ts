/**
 * Fetches and returns headers for a given URL; needed to forward Cache-Control headers.
 */
export default async (url: string): Promise<Headers> => {
  const response = await fetch(url, { method: 'HEAD' });
  return response.headers;
};
