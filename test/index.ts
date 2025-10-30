import path from 'pathe';

const __dirname = new URL('.', import.meta.url).pathname;

export const fixture = path.join(__dirname, 'fixture');
export const yarnFixture = path.join(fixture, 'yarn');
export const pnpmFixture = path.join(fixture, 'pnpm');
export const bunFixture = path.join(fixture, 'bun');
export const bunJsonFixture = path.join(fixture, 'bun-json');
export const denoFixture = path.join(fixture, 'deno');
