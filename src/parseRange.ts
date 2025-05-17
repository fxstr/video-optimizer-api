const convertValue = (value: string): number => {
  const parsedValue = parseInt(value, 10);
  if (Number.isNaN(parsedValue)) throw new Error(`Range header is expected to contain a number; is "${value}" instead.`);
  if (parsedValue < 0) throw new Error(`Range header is expected to contain a positive number; is "${value}" instead.`);
  return parsedValue;
}

/**
 * Simple HTTP range header parser; supports just what we need (not multiple ranges, e.g.)
 * Don't use range-parser; it converts bytes=0- to 0-1 instead of 0-end and its syntax is
 * shitty (returns -1 instead of an Error 🤔)
 */
export default (range: string, contentLength: number): [number, number] | undefined => {
  const start = 'bytes=';
  if (!range.startsWith(start)) throw new Error(`Range header is expected to start with "bytes="; is "${range} instead.`);
  const [rangeStart, rangeEnd, ...rest] = range.substring(start.length).split('-');
  if (rest.length > 0) throw new Error(`Range header is expected to contain one start and/or one end; is "${range}" instead.`);
  if (rangeEnd && convertValue(rangeEnd) > contentLength - 1) throw new Error(`Range header must be smaller than the content length; range header is "${range}", content length is ${contentLength.toString()}.`);
  if (!rangeStart && !rangeEnd) throw new Error(`Range header is expected to contain a start and/or an end; is "${range}" instead.`);
  // -20: Use last 20 bytes
  else if (!rangeStart && rangeEnd) {
    return [contentLength - convertValue(rangeEnd), contentLength - 1];
  } else if (rangeStart && !rangeEnd) {
    // 20-: Start after 20 bytes
    const rangeStartNumber = convertValue(rangeStart);
    return [rangeStartNumber, contentLength - 1];
  } else {
    const startNumber = convertValue(rangeStart);
    const endNumber = convertValue(rangeEnd);
    if (startNumber > endNumber) throw new Error(`Range header is expected to contain a start that is smaller than the end; is "${range}" instead.`);
    // 10-20: Just plain regular
    return [convertValue(rangeStart), convertValue(rangeEnd)];
  }
};
