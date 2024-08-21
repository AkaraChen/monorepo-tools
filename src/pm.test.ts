import { expect, test } from 'vitest';
import { pnpmFixture } from '../test';
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
