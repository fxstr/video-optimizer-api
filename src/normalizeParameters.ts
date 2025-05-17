import { ParsedQs } from 'qs';
import { NormalizedParameters, OutputFormats } from 'video-optimizer';
import QueryParameterError from './QueryParameterError.js';
import convertTimeToMs from './convertTimeToMs.js';

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
  const defaultFormat = 'h264';

  const normalizedParameters: NormalizedParameters = {
    source: '',
    height: null,
    width: null,
    trimStartMs: null,
    trimEndMs: null,
    format: defaultFormat,
    fps: null,
    quality: null,
    keyframeInterval: null,
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
  // Default must come first
  const validFormats = [defaultFormat, 'av1', 'jpg'];
  const format = getValueAsString({ value: query.format, name: 'format' });
  if (format && !validFormats.includes(format)) {
    throw new QueryParameterError(`GET parameter "format" must be one of ${validFormats.map((validFormat): string => `"${validFormat}"`).join(', ')}; is ${format} instead.`);
  }
  if (format) normalizedParameters.format = format as OutputFormats;

  // FPS
  const fps = getValueAsString({ value: query.fps, name: 'fps' });
  if (fps) normalizedParameters.fps = ensureNumber(fps, 'fps');

  // Quality
  const quality = getValueAsString({ value: query.quality, name: 'quality' });
  if (quality) {
    const normalizedQuality = Math.round(ensureNumber(quality, 'quality'));
    if (normalizedQuality < 0 || normalizedQuality > 100) {
      throw new QueryParameterError(`GET parameter "quality" must be a number between 0 and 100; is ${quality} instead.`);
    }
    normalizedParameters.quality = normalizedQuality;
  }

  // Keyframe interval
  const keyframe = getValueAsString({ value: query.keyframe, name: 'keyframe' });
  if (keyframe) {
    const normalizedKeyframe = Math.round(ensureNumber(keyframe, 'keyframe'));
    if (normalizedKeyframe < 0) {
      throw new QueryParameterError(`GET parameter "keyframe" must be a positive integer; is ${keyframe} instead.`);
    }
    normalizedParameters.keyframeInterval = normalizedKeyframe;
  }

  // console.log('Normalized parameters are %o', normalizedParameters);

  return normalizedParameters;
};
