import { join } from 'node:path';

const __dirname = new URL('.', import.meta.url).pathname;

export const fixture = join(__dirname, 'fixture');
export const yarnFixture = join(fixture, 'yarn');
export const pnpmFixture = join(fixture, 'pnpm');
