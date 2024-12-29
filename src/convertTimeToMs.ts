export default (time: string): number => {
  const timeMatch = time.match(/(\d{2}):(\d{2}):(\d{2}).(\d+)/);
  if (timeMatch) {
    const [, hours, minutes, seconds, milliseconds] = timeMatch;
    return (
      (parseInt(hours, 10) * 60 * 60 * 1000)
      + (parseInt(minutes, 10) * 60 * 1000)
      + (parseInt(seconds, 10) * 1000)
      + parseInt(milliseconds, 10)
    );
  }
  throw new Error(`Could not parse time string "${time}"`);
};
