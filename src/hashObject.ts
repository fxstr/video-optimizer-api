import { createHash } from 'node:crypto';

type HashableObject = Record<string, string | number | null>;

const hashObject = (input: HashableObject): string => {
  const sortedObject = Object.keys(input)
    .sort()
    .reduce((previous, key): HashableObject => ({
      ...previous,
      [key]: input[key],
    }), {});
  const json = JSON.stringify(sortedObject);
  const hash = createHash('sha256').update(json).digest('hex');
  return hash;
};

export { hashObject, type HashableObject };
