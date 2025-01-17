import mapQuality from "./mapQuality";

test('maps quality from source to target', () => {
  expect(mapQuality([0, 100], [0, 50], 75)).toBe(37.5);
  expect(mapQuality([100, 0], [50, 0], 25)).toBe(12.5);
  // Inverted direction
  expect(mapQuality([0, 100], [50, 0], 80)).toBe(10);
  expect(mapQuality([100, 0], [0, 50], 20)).toBe(40);
  // Value outside of edge: Throw
  expect(() => mapQuality([0, 100], [0, 50], 101)).toThrow('range (0–100)');
  // Default values for edges according to Ffmpeg; get them for the docs where we mention our
  // sourceRange (0–100)
  // libx264: 23 and 51–0
  // console.log('libx264', mapQuality([51, 0], [0, 100], 23));
  // libsvtav1: 35 and 63–0
  // console.log('libsvtav1', mapQuality([63, 0], [0, 100], 35));
  // libsvtav1: 7 and 31–1
  // console.log('ljpg', mapQuality([31, 1], [0, 100], 7));
});