import { platform } from 'node:os';
import { expect, test } from 'vitest';
import { pnpmFixture, yarnFixture } from '../test';
import { readConfig, resolve } from './utils';

test('safe resolve', () => {
    expect(resolve(platform() === 'win32' ? 'C:\\' : '/').isErr()).toBe(true);
});

test('get monorepo config', async () => {
    const pnpmConfig = await readConfig(pnpmFixture);
    expect(pnpmConfig.pm).toBe('pnpm');

    const yarnConfig = await readConfig(yarnFixture);
    expect(yarnConfig.pm).toBe('yarn');

    expect(() => readConfig(__dirname)).rejects.toThrowError();
});
