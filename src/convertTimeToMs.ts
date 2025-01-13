export default (time: string): number => {
  // Ffmpeg uses a time with just 2 decimal places, therefore we also have to support it.
  const timeMatch = time.match(/(\d+):(\d{2}):(\d{2}).(\d{2,3})/);
  if (timeMatch) {
    const [, hours, minutes, seconds, milliseconds] = timeMatch;
    return (
      (parseInt(hours, 10) * 60 * 60 * 1000)
      + (parseInt(minutes, 10) * 60 * 1000)
      + (parseInt(seconds, 10) * 1000)
      + parseInt(milliseconds, 10)
    );
  }
  throw new Error(`Could not parse time string "${time}"; use the exact format "hh:mm:ss.sss" or "hh:mm:ss.ss", all parts must be provided.`);
};
