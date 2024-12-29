import { marked } from 'marked';
import { fileURLToPath } from 'url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const wrapInScaffold = (htmlContent: string): string => (
  `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Markdown Render</title>
        <link rel="stylesheet" href="/styles/style.css">
    </head>
    <body>
        ${htmlContent}
    </body>
    </html>
  `
);

export default async (): Promise<string> => {
  const directory = dirname(fileURLToPath(import.meta.url));
  const content = readFileSync(join(directory, '../docs/API.md'), 'utf8');
  const output = marked.parse(content);
  const resolvedOutput = await Promise.resolve(output);
  return wrapInScaffold(resolvedOutput);
};
