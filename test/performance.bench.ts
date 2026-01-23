import path from 'pathe';
import { bench, describe } from 'vitest';
import { findRepoRoot, findUpRoot, scanProjects } from '../src/find';
import { isInMonorepo } from '../src/is';
import { detectPM } from '../src/pm';

const fixtureDir = path.join(__dirname, 'fixture');
const perfFixtureDir = path.join(fixtureDir, 'performance');

type PM = 'pnpm' | 'yarn' | 'npm';
type Size = 'tiny' | 'small' | 'medium' | 'large' | 'massive';

const SIZES: Size[] = ['tiny', 'small', 'medium', 'large', 'massive'];

function getFixturePath(pm: PM): string {
    return path.join(fixtureDir, pm);
}

function getPerfFixturePath(pm: PM, size: Size): string {
    return path.join(perfFixtureDir, `${pm}-${size}`);
}

// Scale-based performance benchmarks for scanProjects
describe('scanProjects - scale tests', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        for (const size of SIZES) {
            const iterations = size === 'massive' ? 3 : size === 'large' ? 5 : 10;
            bench(
                `scanProjects - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getPerfFixturePath(pm, size);
                    await scanProjects(fixturePath, pm);
                },
                { iterations },
            );
        }
    }
});

// Scale-based performance benchmarks for findUpRoot
describe('findUpRoot - scale tests', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        for (const size of SIZES) {
            bench(
                `findUpRoot - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getPerfFixturePath(pm, size);
                    await findUpRoot(fixturePath, pm);
                },
                { iterations: 30 },
            );
        }
    }
});

// Scale-based performance benchmarks for findUpRoot from subdirectory
describe('findUpRoot from subdirectory - scale tests', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        for (const size of SIZES) {
            bench(
                `findUpRoot (subdir) - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getPerfFixturePath(pm, size);
                    const subDir = path.join(fixturePath, 'packages', `${pm}-pkg-1`);
                    await findUpRoot(subDir, pm);
                },
                { iterations: 30 },
            );
        }
    }
});

// Scale-based performance benchmarks for isInMonorepo
describe('isInMonorepo - scale tests', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        for (const size of SIZES) {
            bench(
                `isInMonorepo - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getPerfFixturePath(pm, size);
                    const subDir = path.join(fixturePath, 'packages', `${pm}-pkg-1`);
                    await isInMonorepo(fixturePath, subDir);
                },
                { iterations: 20 },
            );
        }
    }
});

// Legacy benchmarks using original small fixtures
describe('scanProjects performance (legacy)', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        bench(
            `scanProjects - ${pm}`,
            async () => {
                const fixturePath = getFixturePath(pm);
                await scanProjects(fixturePath, pm);
            },
            { iterations: 10 },
        );
    }
});

// Performance benchmarks for detectPM
describe('detectPM performance', () => {
    const pms: ('pnpm' | 'yarn' | 'bun' | 'deno')[] = ['pnpm', 'yarn', 'bun', 'deno'];

    for (const pm of pms) {
        bench(
            `detectPM - ${pm}`,
            () => {
                const fixturePath = path.join(fixtureDir, pm);
                detectPM(fixturePath);
            },
            { iterations: 100 },
        );
    }
});

// Performance benchmarks for findRepoRoot
describe('findRepoRoot performance', () => {
    bench(
        'findRepoRoot - from workspace root',
        async () => {
            const workspaceRoot = path.join(__dirname, '..');
            await findRepoRoot(workspaceRoot);
        },
        { iterations: 50 },
    );

    bench(
        'findRepoRoot - from nested directory',
        async () => {
            const nestedDir = path.join(__dirname, 'fixture', 'pnpm', 'packages');
            await findRepoRoot(nestedDir);
        },
        { iterations: 50 },
    );
});
