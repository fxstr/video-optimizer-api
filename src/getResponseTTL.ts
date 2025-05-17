/**
 * Extracts the maxage headers and calculates the time the video may stage cached (as an absolute
 * date in Unix timestamp)
 */
export default (cacheControlHeader: string): number => {
  const parts = cacheControlHeader.split(',').map((part): string => part.trim());
  const directives = Object.fromEntries(
    parts.map((part): [string, number | boolean] => {
      const [key, value] = part.split('=');
      return [key.toLowerCase(), value === undefined ? true : parseInt(value, 10)];
    }),
  );
  const now = Math.round(new Date().getTime() / 1000);
  // Resource is not public: Do not cache it
  if (!directives.public) return now;
  // Prefer maxage directive for pubic proxies, fallback to regular max-age
  const expiry = directives['s-maxage'] ?? directives['max-age'];
  if (expiry && typeof expiry === 'number' && !Number.isNaN(expiry)) return now + expiry;
  return now;
};
