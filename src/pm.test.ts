import { expect, test } from 'vitest';
import { bunFixture, denoFixture, pnpmFixture } from '../test';
import { detectPMByLock, detectPMByUA } from './pm';

test('get by lockfile', async () => {
    const pm = detectPMByLock(pnpmFixture);
    expect(pm.unwrap()).toBe('pnpm');
});

test('get by user agent', () => {
    process.env.npm_config_user_agent = 'pnpm/2.0.0';
    const pm = detectPMByUA();
    expect(pm.unwrap()).toBe('pnpm');
});

test('detect bun by lockfile', async () => {
    const pm = detectPMByLock(bunFixture);
    expect(pm.unwrap()).toBe('bun');
});

test('detect deno by lockfile', async () => {
    const pm = detectPMByLock(denoFixture);
    expect(pm.unwrap()).toBe('deno');
});

test('detect bun by user agent', () => {
    process.env.npm_config_user_agent = 'bun/1.0.0';
    const pm = detectPMByUA();
    expect(pm.unwrap()).toBe('bun');
});

test('detect deno by user agent', () => {
    process.env.npm_config_user_agent = 'deno/1.0.0';
    const pm = detectPMByUA();
    expect(pm.unwrap()).toBe('deno');
});
