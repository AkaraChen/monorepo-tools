import path from 'pathe';
import { describe, expect, test } from 'vitest';
import { findPackagesFixture, pnpmFixture } from '../../test';
import { findPackages } from './find-packages';

describe('findPackages', () => {
    test('should find packages in valid pnpm workspace', async () => {
        const projects = await findPackages(pnpmFixture);

        expect(projects.length).toBe(3);

        const rootProject = projects.find((p) => p.rootDir === pnpmFixture);
        expect(rootProject).toBeDefined();
        expect(rootProject?.manifest.name).toBe('pnpm');

        const pkgNames = projects.map((p) => p.manifest.name);
        expect(pkgNames).toContain('pnpm-pkg-1');
        expect(pkgNames).toContain('pnpm-pkg-2');
    });

    test('should find packages in custom valid workspace', async () => {
        const validWorkspace = path.join(
            findPackagesFixture,
            'valid-workspace',
        );
        const projects = await findPackages(validWorkspace);

        expect(projects.length).toBe(3);

        const pkgNames = projects.map((p) => p.manifest.name);
        expect(pkgNames).toContain('pkg-a');
        expect(pkgNames).toContain('pkg-b');
        expect(pkgNames).toContain('valid-workspace-root');
    });

    test('should return only root package when patterns array is empty', async () => {
        const emptyPatterns = path.join(findPackagesFixture, 'empty-patterns');
        const projects = await findPackages(emptyPatterns);

        expect(projects.length).toBe(1);
        expect(projects[0].rootDir).toBe(emptyPatterns);
        expect(projects[0].manifest.name).toBe('empty-patterns-root');
    });

    test('should return only root package when packages field is undefined', async () => {
        const noPackagesField = path.join(
            findPackagesFixture,
            'no-packages-field',
        );
        const projects = await findPackages(noPackagesField);

        expect(projects.length).toBe(1);
        expect(projects[0].manifest.name).toBe('no-packages-field-root');
    });

    test('should throw when a package.json contains invalid JSON', async () => {
        const invalidPkgJson = path.join(
            findPackagesFixture,
            'invalid-pkg-json',
        );

        await expect(findPackages(invalidPkgJson)).rejects.toThrow();
    });

    test('should throw when pnpm-workspace.yaml does not exist', async () => {
        const noYaml = '/tmp/non-existent-workspace-dir';

        await expect(findPackages(noYaml)).rejects.toThrow();
    });

    test('should return correct Project structure', async () => {
        const projects = await findPackages(pnpmFixture);

        for (const project of projects) {
            expect(project).toHaveProperty('rootDir');
            expect(project).toHaveProperty('manifest');
            expect(typeof project.rootDir).toBe('string');
            expect(typeof project.manifest).toBe('object');
            expect(path.isAbsolute(project.rootDir)).toBe(true);
        }
    });

    test('should ignore node_modules directory', async () => {
        const projects = await findPackages(pnpmFixture);

        const hasNodeModules = projects.some((p) =>
            p.rootDir.includes('node_modules'),
        );
        expect(hasNodeModules).toBe(false);
    });
});
