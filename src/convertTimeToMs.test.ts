import convertTimeToMs from './convertTimeToMs.js';

test('does not accept invalid time', ():void => {
  expect((): number => convertTimeToMs('test')).toThrow(/time string "test"/);
});

test('converts time to ms', ():void => {
  expect(convertTimeToMs('00:00:02.000')).toEqual(2000);
  expect(convertTimeToMs('123:21:02.001')).toEqual(444062001);
  // Use 81 instead uf 21 mins … invalid, but do we care?
  expect(convertTimeToMs('123:81:02.001')).toEqual(444062001 + 60 * 60000);
});
