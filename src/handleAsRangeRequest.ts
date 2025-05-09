/**
 * Handle a request as a range request if:
 * - it does not contain a range header
 * - the range header is exactly "bytes=0-"
 * In every other case, only send the data requeste in a 206 status response.
 */
export default (rangeHeader?: string): boolean => (
  !!rangeHeader && !(/^bytes=0-$\s*/.test(rangeHeader))
);
