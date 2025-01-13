import { ParsedQs } from 'qs';
import QueryParameterError from './QueryParameterError.js';
import convertTimeToMs from './convertTimeToMs.js';
import { NormalizedParameters } from './types/NormalizedParameters.js';

interface GetValueProperties {
  value: string | string[] | undefined | ParsedQs | ParsedQs[];
  name: string,
}

/**
 * Takes a value from an Express queryString, returns it as a string or undefined, throws if
 * multiple values were used.
 */
const getValueAsString = ({ value, name }: GetValueProperties): string | undefined => {
  if (Array.isArray(value)) {
    throw new QueryParameterError(`GET Parameter "${name}" must be a single value; you probalby passed multiple GET parameters of the same name.`);
  }
  const stringifiedParam: string | undefined = value?.toString();
  return stringifiedParam;
};

/**
 * Converts string to an integer and throws if it's not.
 */
const ensureNumber = (value: string, name: string): number => {
  const parsedNumber = parseFloat(value);
  if (Number.isNaN(parsedNumber)) {
    throw new QueryParameterError(`GET parameter "${name}" must be an number, is ${value} instead.`);
  }
  return parsedNumber;
};

/**
 * Just creates a nice error message.
 */
const createMissingQueryParameterError = (parameter: string): QueryParameterError => (
  new QueryParameterError(`Required GET parameter "${parameter}" is missing.`)
);

/**
 * Takes an Express queryString, validates and normalizes it.
 */
export default (query: ParsedQs): NormalizedParameters => {
  const normalizedParameters: NormalizedParameters = {
    source: null,
    height: null,
    width: null,
    trimStartMs: null,
    trimEndMs: null,
    format: null,
    fps: null,
    quality: null,
  };

  // Source
  const source = getValueAsString({ value: query.source, name: 'source' });
  if (!source) throw createMissingQueryParameterError('source');
  if (!/https?:\/\//.test(source)) throw new QueryParameterError('The GET parameter source must start with "http://" or "https://".');
  normalizedParameters.source = source;

  // Size
  const size = getValueAsString({ value: query.size, name: 'size' });
  if (size) {
    const [rawWidth, rawHeight] = size.split('/');
    if (rawWidth) {
      normalizedParameters.width = Math.round(ensureNumber(rawWidth, 'size (width)'));
    }
    if (rawHeight) {
      normalizedParameters.height = Math.round(ensureNumber(rawHeight, 'size (height)'));
    }
  }

  // Trim
  const trim = getValueAsString({ value: query.trim, name: 'trim' });
  if (trim) {
    const [rawFrom, rawTo] = trim.split('/');
    const from = rawFrom ? convertTimeToMs(rawFrom) : null;
    const to = rawTo ? convertTimeToMs(rawTo) : null;
    if (from && to && to < from) {
      throw new QueryParameterError(`When you provide from and to for GET parameter "trim", the from value (${rawFrom}) must be smaller than the two value (${rawTo}).`);
    }
    if (rawFrom) normalizedParameters.trimStartMs = from;
    if (rawTo) normalizedParameters.trimEndMs = to;
  }

  // Format
  const validFormats = ['h264', 'av1', 'jpg'];
  const format = getValueAsString({ value: query.format, name: 'format' });
  if (format && !validFormats.includes(format)) {
    throw new QueryParameterError(`GET parameter "format" must be one of ${validFormats.join(', ')}, is ${format} instead.`);
  }
  if (format) normalizedParameters.format = format;

  // FPS
  const fps = getValueAsString({ value: query.fps, name: 'fps' });
  if (fps) normalizedParameters.fps = ensureNumber(fps, 'fps');

  // Quality
  const quality = getValueAsString({ value: query.quality, name: 'quality' });
  if (quality) normalizedParameters.quality = Math.round(ensureNumber(quality, 'quality'));

  return normalizedParameters;
};
