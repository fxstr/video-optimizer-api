export default (...vars: string[]): string[] => (
  [...vars].map((keyName): string => {
    if (process.env[keyName]) return process.env[keyName];
    throw new Error(`Required environment variable with key $${keyName} is not set`);
  })
);
