import path from 'pathe';
import { bench, describe } from 'vitest';
import { findUpRoot, scanProjects } from '../src/find';
import { isInMonorepo } from '../src/is';
import { detectPM } from '../src/pm';

const performanceFixtureDir = path.join(__dirname, 'fixture', 'performance');

type PM = 'pnpm' | 'yarn' | 'npm';
type Size = 'small' | 'medium' | 'large';

function getFixturePath(pm: PM, size: Size): string {
    return path.join(performanceFixtureDir, `${pm}-${size}`);
}

// Performance benchmarks for scanProjects
describe('scanProjects performance', () => {
    const pms: PM[] = ['pnpm', 'yarn', 'npm'];
    const sizes: Size[] = ['small', 'medium', 'large'];

    for (const pm of pms) {
        for (const size of sizes) {
            bench(
                `scanProjects - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getFixturePath(pm, size);
                    await scanProjects(fixturePath, pm);
                },
                {
                    iterations: 10,
                },
            );
        }
    }
});

// Performance benchmarks for findUpRoot
describe('findUpRoot performance', () => {
    const pms: PM[] = ['pnpm', 'yarn', 'npm'];
    const sizes: Size[] = ['small', 'medium', 'large'];

    for (const pm of pms) {
        for (const size of sizes) {
            bench(
                `findUpRoot - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getFixturePath(pm, size);
                    await findUpRoot(fixturePath, pm);
                },
                {
                    iterations: 50,
                },
            );
        }
    }
});

// Performance benchmarks for findUpRoot from subdirectory
describe('findUpRoot from subdirectory performance', () => {
    const pms: PM[] = ['pnpm', 'yarn', 'npm'];
    const sizes: Size[] = ['small', 'medium', 'large'];

    for (const pm of pms) {
        for (const size of sizes) {
            bench(
                `findUpRoot (from subdir) - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getFixturePath(pm, size);
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
    }
});

// Performance benchmarks for isInMonorepo
describe('isInMonorepo performance', () => {
    const pms: PM[] = ['pnpm', 'yarn', 'npm'];
    const sizes: Size[] = ['small', 'medium', 'large'];

    for (const pm of pms) {
        for (const size of sizes) {
            bench(
                `isInMonorepo - ${pm} - ${size}`,
                async () => {
                    const fixturePath = getFixturePath(pm, size);
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
    }
});

// Performance benchmarks for detectPM
describe('detectPM performance', () => {
    const pms: PM[] = ['pnpm', 'yarn', 'npm'];
    const sizes: Size[] = ['small', 'medium', 'large'];

    for (const pm of pms) {
        for (const size of sizes) {
            bench(
                `detectPM - ${pm} - ${size}`,
                () => {
                    const fixturePath = getFixturePath(pm, size);
                    detectPM(fixturePath);
                },
                {
                    iterations: 100,
                },
            );
        }
    }
});
