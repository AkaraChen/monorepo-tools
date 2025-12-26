import { expect, test } from 'vitest';
import {
    bunFixture,
    bunJsonFixture,
    denoFixture,
    pnpmFixture,
    yarnFixture,
} from '../test';
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
    expect(await findUpRoot(pkg1.rootDir, detectPM(pnpmFixture).unwrap())).toBe(
        pnpmFixture,
    );
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

test('test find in bun root workspace', async () => {
    const projects = await scanProjects(
        bunFixture,
        detectPM(bunFixture).unwrap(),
    );
    expect(projects.length).toBe(3);

    const root = await findUpRoot(bunFixture, detectPM(bunFixture).unwrap());
    expect(root).toBe(bunFixture);
});

test('test find in bun sub workspace', async () => {
    const projects = await scanProjects(
        bunFixture,
        detectPM(bunFixture).unwrap(),
    );
    const pkg1 = projects.at(0);
    if (!pkg1) throw new Error('pkg1 not found');
    expect(await findUpRoot(pkg1.rootDir, detectPM(bunFixture).unwrap())).toBe(
        bunFixture,
    );
});

test('test find in bun-json root workspace', async () => {
    const projects = await scanProjects(
        bunJsonFixture,
        detectPM(bunJsonFixture).unwrap(),
    );
    expect(projects.length).toBe(3);

    const root = await findUpRoot(
        bunJsonFixture,
        detectPM(bunJsonFixture).unwrap(),
    );
    expect(root).toBe(bunJsonFixture);
});

test('test find in bun-json sub workspace', async () => {
    const projects = await scanProjects(
        bunJsonFixture,
        detectPM(bunJsonFixture).unwrap(),
    );
    const pkg1 = projects.at(0);
    if (!pkg1) throw new Error('pkg1 not found');
    expect(
        await findUpRoot(pkg1.rootDir, detectPM(bunJsonFixture).unwrap()),
    ).toBe(bunJsonFixture);
});

test('test find in deno root workspace', async () => {
    const projects = await scanProjects(
        denoFixture,
        detectPM(denoFixture).unwrap(),
    );
    expect(projects.length).toBe(3);

    const root = await findUpRoot(denoFixture, detectPM(denoFixture).unwrap());
    expect(root).toBe(denoFixture);
});

test('test find in deno sub workspace', async () => {
    const projects = await scanProjects(
        denoFixture,
        detectPM(denoFixture).unwrap(),
    );
    const pkg1 = projects.at(0);
    if (!pkg1) throw new Error('pkg1 not found');
    expect(await findUpRoot(pkg1.rootDir, detectPM(denoFixture).unwrap())).toBe(
        denoFixture,
    );
});
