export default (
  [sourceFrom, sourceTo]: [number, number],
  [targetFrom, targetTo]: [number, number],
  value: number
): number => {
  const lowerSourceEdge = Math.min(sourceFrom, sourceTo);
  const upperSourceEdge = Math.max(sourceFrom, sourceTo);
  // When testing if value is in the range, make sure that e.g. 23 is in 51–0 (inverted scale);
  // to do so, we must not take the first but the *lower* value to compare.
  if (value < lowerSourceEdge || value > upperSourceEdge) {
    throw new Error(`Value ${value} is outside of source range (${sourceFrom}–${sourceTo}).`);
  }
  const sourceRange = sourceTo - sourceFrom;
  const targetRange = targetTo - targetFrom;
  const relativeSourceValue = (value - sourceFrom) / sourceRange;
  const oneUnit = targetRange / sourceRange;
  return targetFrom + relativeSourceValue * targetRange;
};
