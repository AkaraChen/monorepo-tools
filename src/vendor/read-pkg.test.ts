import path from 'pathe';
import { afterEach, describe, expect, test } from 'vitest';
import { packageJsonCache } from '../cache';
import { readPkgFixture } from '../../test';
import { readPackage } from './read-pkg';

describe('readPackage', () => {
    afterEach(() => {
        packageJsonCache.clear();
    });

    test('should read package.json from disk when not cached', async () => {
        const validDir = path.join(readPkgFixture, 'valid');
        const result = await readPackage({ cwd: validDir });

        expect(result).toBeDefined();
        expect(result.name).toBe('test-valid-pkg');
        expect(result.version).toBe('1.0.0');
    });

    test('should return cached result on second call', async () => {
        const validDir = path.join(readPkgFixture, 'valid');

        const result1 = await readPackage({ cwd: validDir });

        const filePath = path.join(validDir, 'package.json');
        expect(packageJsonCache.has(filePath)).toBe(true);

        const result2 = await readPackage({ cwd: validDir });

        expect(result1).toBe(result2);
    });

    test('should throw when package.json contains invalid JSON', async () => {
        const invalidDir = path.join(readPkgFixture, 'invalid-json');

        await expect(readPackage({ cwd: invalidDir })).rejects.toThrow();
    });

    test('should throw when package.json does not exist', async () => {
        const nonExistentDir = path.join(readPkgFixture, 'non-existent');

        await expect(readPackage({ cwd: nonExistentDir })).rejects.toThrow();
    });

    test('should use process.cwd() when cwd option is not provided', async () => {
        const originalCwd = process.cwd();
        const validDir = path.join(readPkgFixture, 'valid');

        try {
            process.chdir(validDir);
            const result = await readPackage();
            expect(result.name).toBe('test-valid-pkg');
        } finally {
            process.chdir(originalCwd);
        }
    });

    test('should cache using absolute file path', async () => {
        const validDir = path.join(readPkgFixture, 'valid');
        await readPackage({ cwd: validDir });

        const expectedKey = path.join(validDir, 'package.json');
        expect(packageJsonCache.has(expectedKey)).toBe(true);
    });
});
