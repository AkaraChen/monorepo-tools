import { expect, test } from 'vitest';
import { pnpmFixture, yarnFixture } from '../test';
import { findUpRoot, scanProjects } from './find';
import { detectPM } from './pm';

test('test find in pnpm root workspace', async () => {
    const projects = await scanProjects(
        pnpmFixture,
        detectPM(pnpmFixture).unwrap(),
    );
    expect(projects.length).toBe(3);

    const root = await findUpRoot(pnpmFixture, detectPM(pnpmFixture).unwrap());
    expect(root).toBe(pnpmFixture);
});

test('test find in pnpm sub workspace', async () => {
    const projects = await scanProjects(
        pnpmFixture,
        detectPM(pnpmFixture).unwrap(),
    );
    const pkg1 = projects.at(0);
    if (!pkg1) throw new Error('pkg1 not found');
    expect(
        await findUpRoot(pkg1.rootDir, detectPM(pkg1.rootDir).unwrap()),
    ).toBe(pnpmFixture);
});

test('test find in yarn root workspace', async () => {
    const projects = await scanProjects(
        yarnFixture,
        detectPM(yarnFixture).unwrap(),
    );
    expect(projects.length).toBe(3);

    const root = await findUpRoot(yarnFixture, detectPM(yarnFixture).unwrap());
    expect(root).toBe(yarnFixture);
});

test('test find in yarn sub workspace', async () => {
    const projects = await scanProjects(
        yarnFixture,
        detectPM(yarnFixture).unwrap(),
    );
    const pkg1 = projects.at(0);
    if (!pkg1) throw new Error('pkg1 not found');
    expect(await findUpRoot(pkg1.rootDir, detectPM(yarnFixture).unwrap())).toBe(
        yarnFixture,
    );
});
