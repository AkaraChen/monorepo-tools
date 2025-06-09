import path from 'pathe';
import { expect, test } from 'vitest';
import { pnpmFixture, yarnFixture } from '../test';
import { isInMonorepo, isRoot } from './is';

test('is monorepo root', async () => {
    expect(await isRoot(pnpmFixture)).toBe(true);
    expect(await isRoot(yarnFixture)).toBe(true);
    expect(async () => await isRoot(__dirname)).rejects.toThrow();
});

test('is workspace in monorepo', async () => {
    expect(
        await isInMonorepo(
            pnpmFixture,
            path.join(pnpmFixture, 'packages', 'pnpm-pkg-1'),
        ),
    ).toBe(true);
    expect(await isInMonorepo(pnpmFixture, yarnFixture)).toBe(false);

    expect(
        await isInMonorepo(
            yarnFixture,
            path.join(yarnFixture, 'packages', 'yarn-pkg-1'),
        ),
    ).toBe(true);
    expect(await isInMonorepo(yarnFixture, pnpmFixture)).toBe(false);
});
