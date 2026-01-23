import fs from 'node:fs';
import path from 'pathe';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { findUpFixture } from '../../test';
import { findUp } from './find-up';

describe('findUp', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('should find file in current directory', async () => {
        const result = await findUp('target-file.txt', { cwd: findUpFixture });
        expect(result).toBe(path.join(findUpFixture, 'target-file.txt'));
    });

    test('should find directory when type is directory', async () => {
        const result = await findUp('target-dir', {
            cwd: findUpFixture,
            type: 'directory',
        });
        expect(result).toBe(path.join(findUpFixture, 'target-dir'));
    });

    test('should find file by traversing up directories', async () => {
        const deepDir = path.join(findUpFixture, 'nested', 'deep', 'dir');
        const result = await findUp('target-file.txt', { cwd: deepDir });
        expect(result).toBe(path.join(findUpFixture, 'target-file.txt'));
    });

    test('should not match when looking for file but found directory', async () => {
        const result = await findUp('target-dir', {
            cwd: findUpFixture,
            type: 'file',
        });
        expect(result).toBeUndefined();
    });

    test('should not match when looking for directory but found file', async () => {
        const result = await findUp('target-file.txt', {
            cwd: findUpFixture,
            type: 'directory',
        });
        expect(result).toBeUndefined();
    });

    test('should return undefined when target does not exist', async () => {
        const result = await findUp('non-existent-file.xyz', {
            cwd: findUpFixture,
        });
        expect(result).toBeUndefined();
    });

    test('should stop at root directory', async () => {
        const result = await findUp('definitely-not-existing-file-xyz123.txt', {
            cwd: '/',
        });
        expect(result).toBeUndefined();
    });

    test('should use process.cwd() when cwd option is not provided', async () => {
        const originalCwd = process.cwd();
        try {
            process.chdir(findUpFixture);
            const result = await findUp('target-file.txt');
            expect(result).toBe(path.join(findUpFixture, 'target-file.txt'));
        } finally {
            process.chdir(originalCwd);
        }
    });

    test('should continue searching when statSync throws', async () => {
        const originalStatSync = fs.statSync;
        let callCount = 0;

        vi.spyOn(fs, 'statSync').mockImplementation((p, options) => {
            callCount++;
            if (callCount === 1) {
                throw new Error('Simulated stat error');
            }
            return originalStatSync(p, options);
        });

        const deepDir = path.join(findUpFixture, 'nested', 'deep', 'dir');
        const result = await findUp('target-file.txt', { cwd: deepDir });

        expect(result).toBe(path.join(findUpFixture, 'target-file.txt'));
    });

    test('should handle parentDir === dir case', async () => {
        // This tests the break condition when parentDir equals dir
        // which can happen on some edge cases
        const result = await findUp('some-file.txt', { cwd: '/' });
        expect(result).toBeUndefined();
    });
});
