import { createHash } from 'node:crypto';

/**
 * Hashes a query string that we use for caching and queuing.
 * @param {Object} parsed queryString
 */
export default (queryString: { [key: string]: string }): string => {
  // Sort by key: The parameters' sort order is not relevant for the hash/cache
  const keys = Object.keys(queryString);
  const sortedKeys = keys.sort();
  const sortedQueryString = sortedKeys.map((key): string => (
    // Encode keys and values to make sure that = and & are unique separatores
    `${encodeURIComponent(key)}=${encodeURIComponent(queryString[key])}`
  )).join('&');
  const hash = createHash('sha256').update(sortedQueryString).digest('hex');
  return hash;
};
