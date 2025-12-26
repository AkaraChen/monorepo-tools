import path from 'pathe';
import { bench, describe } from 'vitest';
import { findRepoRoot, findUpRoot, scanProjects } from '../src/find';
import { isInMonorepo } from '../src/is';
import { detectPM } from '../src/pm';

const fixtureDir = path.join(__dirname, 'fixture');

type PM = 'pnpm' | 'yarn' | 'bun' | 'deno';

function getFixturePath(pm: PM): string {
    return path.join(fixtureDir, pm);
}

// Performance benchmarks for scanProjects
describe('scanProjects performance', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        bench(
            `scanProjects - ${pm}`,
            async () => {
                const fixturePath = getFixturePath(pm);
                await scanProjects(fixturePath, pm);
            },
            {
                iterations: 10,
            },
        );
    }
});

// Performance benchmarks for findUpRoot
describe('findUpRoot performance', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        bench(
            `findUpRoot - ${pm}`,
            async () => {
                const fixturePath = getFixturePath(pm);
                await findUpRoot(fixturePath, pm);
            },
            {
                iterations: 50,
            },
        );
    }
});

// Performance benchmarks for findUpRoot from subdirectory
describe('findUpRoot from subdirectory performance', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        bench(
            `findUpRoot (from subdir) - ${pm}`,
            async () => {
                const fixturePath = getFixturePath(pm);
                const subDir = path.join(
                    fixturePath,
                    'packages',
                    `${pm}-pkg-1`,
                );
                await findUpRoot(subDir, pm);
            },
            {
                iterations: 50,
            },
        );
    }
});

// Performance benchmarks for isInMonorepo
describe('isInMonorepo performance', () => {
    const pms: PM[] = ['pnpm', 'yarn'];

    for (const pm of pms) {
        bench(
            `isInMonorepo - ${pm}`,
            async () => {
                const fixturePath = getFixturePath(pm);
                const subDir = path.join(
                    fixturePath,
                    'packages',
                    `${pm}-pkg-1`,
                );
                await isInMonorepo(fixturePath, subDir);
            },
            {
                iterations: 30,
            },
        );
    }
});

// Performance benchmarks for detectPM
describe('detectPM performance', () => {
    const pms: PM[] = ['pnpm', 'yarn', 'bun', 'deno'];

    for (const pm of pms) {
        bench(
            `detectPM - ${pm}`,
            () => {
                const fixturePath = getFixturePath(pm);
                detectPM(fixturePath);
            },
            {
                iterations: 100,
            },
        );
    }
});

// Performance benchmarks for findRepoRoot
describe('findRepoRoot performance', () => {
    bench(
        'findRepoRoot - from workspace root',
        async () => {
            // Use the actual workspace root which should have .git
            const workspaceRoot = path.join(__dirname, '..');
            await findRepoRoot(workspaceRoot);
        },
        {
            iterations: 50,
        },
    );

    bench(
        'findRepoRoot - from nested directory',
        async () => {
            // Test from a deeply nested directory
            const nestedDir = path.join(__dirname, 'fixture', 'pnpm', 'packages');
            await findRepoRoot(nestedDir);
        },
        {
            iterations: 50,
        },
    );
});
