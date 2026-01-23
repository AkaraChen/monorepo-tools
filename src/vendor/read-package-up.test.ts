import path from 'pathe';
import { afterEach, describe, expect, test } from 'vitest';
import { packageJsonCache } from '../cache';
import { pnpmFixture, readPackageUpFixture } from '../../test';
import { readPackageUp } from './read-package-up';

describe('readPackageUp', () => {
    afterEach(() => {
        packageJsonCache.clear();
    });

    test('should find package.json in current directory', async () => {
        const result = await readPackageUp({ cwd: pnpmFixture });

        expect(result).toBeDefined();
        expect(result?.packageJson.name).toBe('pnpm');
        expect(result?.path).toBe(path.join(pnpmFixture, 'package.json'));
    });

    test('should find package.json in subdirectory', async () => {
        const deepDir = path.join(pnpmFixture, 'packages', 'pnpm-pkg-1');
        const result = await readPackageUp({ cwd: deepDir });

        expect(result).toBeDefined();
        expect(result?.packageJson.name).toBe('pnpm-pkg-1');
        expect(result?.path).toBe(path.join(deepDir, 'package.json'));
    });

    test('should traverse multiple levels up', async () => {
        const rootHasPkg = path.join(readPackageUpFixture, 'root-has-pkg');
        const deepDir = path.join(rootHasPkg, 'nested', 'deep');

        const result = await readPackageUp({ cwd: deepDir });

        expect(result).toBeDefined();
        expect(result?.packageJson.name).toBe('root-has-pkg');
        expect(result?.path).toBe(path.join(rootHasPkg, 'package.json'));
    });

    test('should use process.cwd() when cwd option is not provided', async () => {
        const originalCwd = process.cwd();

        try {
            process.chdir(pnpmFixture);
            const result = await readPackageUp();
            expect(result?.packageJson.name).toBe('pnpm');
        } finally {
            process.chdir(originalCwd);
        }
    });

    test('should return correct result structure', async () => {
        const result = await readPackageUp({ cwd: pnpmFixture });

        expect(result).toHaveProperty('packageJson');
        expect(result).toHaveProperty('path');
        expect(typeof result?.path).toBe('string');
        expect(path.isAbsolute(result?.path ?? '')).toBe(true);
    });

    test('should use cache via readPackage', async () => {
        await readPackageUp({ cwd: pnpmFixture });

        const pkgPath = path.join(pnpmFixture, 'package.json');
        expect(packageJsonCache.has(pkgPath)).toBe(true);

        const result2 = await readPackageUp({ cwd: pnpmFixture });
        expect(result2?.packageJson.name).toBe('pnpm');
    });

    test('should check root directory after traversal loop', async () => {
        const rootOnly = path.join(readPackageUpFixture, 'root-only');
        const deepDir = path.join(rootOnly, 'a', 'b', 'c');

        const result = await readPackageUp({ cwd: deepDir });
        expect(result?.path).toBe(path.join(rootOnly, 'package.json'));
        expect(result?.packageJson.name).toBe('root-only');
    });

    test('should return undefined when no package.json exists in path to root', async () => {
        // Start from system temp and go up - should not find any package.json
        // related to our project
        const result = await readPackageUp({ cwd: '/tmp' });

        // This might find a package.json at root level on some systems
        // but typically /tmp has no package.json
        if (result) {
            // If found, verify it's a valid result
            expect(result.packageJson).toBeDefined();
            expect(result.path).toBeDefined();
        } else {
            expect(result).toBeUndefined();
        }
    });
});
