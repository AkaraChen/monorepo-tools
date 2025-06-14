import path from 'pathe';

const __dirname = new URL('.', import.meta.url).pathname;

export const fixture = path.join(__dirname, 'fixture');
export const yarnFixture = path.join(fixture, 'yarn');
export const pnpmFixture = path.join(fixture, 'pnpm');
