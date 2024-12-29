import { ParsedQs } from 'qs';
import QueryParameterError from './QueryParameterError.js';
import convertTimeToMs from './convertTimeToMs.js';

// const directoryPath = path.dirname(fileURLToPath(import.meta.url));

const createMissingQueryParameterError = (parameter: string): QueryParameterError => (
  new QueryParameterError(`Required GET parameter "${parameter}" is missing.`)
);

interface GetValueProperties {
  value: string | string[] | undefined | ParsedQs | ParsedQs[];
  name: string,
}

interface ReturnProperties {
  ffmpegArguments: string[],
  fileType: string,
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

export default (query: ParsedQs): ReturnProperties => {
  console.log('parsedArguments', query);

  const ffmpegArguments: string[] = [];
  let fileType: string = '';

  // Source
  const source = getValueAsString({ value: query.source, name: 'source' });
  if (!source) throw createMissingQueryParameterError('source');
  if (!/https?:\/\//.test(source)) throw new QueryParameterError('The GET parameter source must start with "http://" or "https://".');
  ffmpegArguments.push('-i', source);

  // Size: Before output format to make sure we convert the resized (probably smaller) video
  const size = getValueAsString({ value: query.size, name: 'size' });
  if (size) {
    const [rawWidth, rawHeight] = size.split('/');
    if (rawWidth && !rawHeight) {
      const width = parseInt(rawWidth, 10);
      console.log('Resize to width %d', width);
      // Should we add ,format=yuv420p here?
      ffmpegArguments.push('-vf', `scale=${width.toString()}:trunc(ow/a/2)*2`);
    } else if (rawHeight && !rawWidth) {
      const height = parseInt(rawHeight, 10);
      console.log('Resize to height %d', height);
      ffmpegArguments.push('-vf', `scale=trunc(oh*a/2)*2:${height.toString()}`);
    } else {
      throw new QueryParameterError('Size must either be a number (e.g. "720") for width or a slash followed by a number (e.g. "/480") for height.');
    }
  }

  // Trim (this is all quick and dirty and needs refactoring! Too much DRY here.)
  const trim = getValueAsString({ value: query.trim, name: 'trim' });
  if (trim) {
    const [from, to] = trim.split('/');
    let fromInSeconds: number = 0;
    if (from) {
      try {
        fromInSeconds = convertTimeToMs(from) / 1000;
        // Use toFixed to cut of funny JS calculations (1.000000002 etc.)
        ffmpegArguments.push('-ss', fromInSeconds.toFixed(3));
      } catch (err) {
        throw new QueryParameterError(`Could not convert "from" property with value ${from} of GET parameter "trim" to milliseconds; make sure the input format is "hh:mm:ss.ssss"`);
      }
    }
    // TODO: Handle to < from
    if (to) {
      try {
        const toInSeconds = convertTimeToMs(to) / 1000;
        console.log('to is %o, in sec: %o', to, toInSeconds);
        ffmpegArguments.push('-t', (toInSeconds - fromInSeconds).toFixed(3));
      } catch (err) {
        throw new QueryParameterError(`Could not convert "to" property with value ${to} of GET parameter "trim" to milliseconds; make sure the input format is "hh:mm:ss.ssss"`);
      }
    }
  }

  // Type
  const format = getValueAsString({ value: query.format, name: 'format' }) || 'h264';
  if (format === 'h264') {
    // TODO: Use optimized converter based on hardware
    ffmpegArguments.push('-c:v', 'libx264');
    ffmpegArguments.push('-preset', 'ultrafast');
    ffmpegArguments.push('-f', 'mp4');
    ffmpegArguments.push('-movflags', 'frag_keyframe+empty_moov');
    fileType = 'mp4';
  } else if (format === 'av1') {
    // libaom-av1 is slow AF
    ffmpegArguments.push('-c:v', 'libsvtav1');
    // ffmpegArguments.push('-c:v', 'librav1e');
    ffmpegArguments.push('-crf', '20');
    ffmpegArguments.push('-f', 'mp4');
    ffmpegArguments.push('-movflags', 'frag_keyframe+empty_moov');
    fileType = 'mp4';
  } else if (format === 'jpg') {
    ffmpegArguments.push('-vframes', '1');
    ffmpegArguments.push('-f', 'image2');
    ffmpegArguments.push('-vcodec', 'mjpeg');
    fileType = 'jpg';
  } else {
    throw new QueryParameterError('GET parameter "format" must be one of "h264" …');
  }

  // Make things verbose to simplify debugging (also on live data)
  ffmpegArguments.push('-v', 'verbose');
  // Make sure output is streamed to stdout
  ffmpegArguments.push('-');
  console.log('ffmpegArguments are %o', ffmpegArguments.join(' '));

  return {
    ffmpegArguments,
    fileType,
  };
};
