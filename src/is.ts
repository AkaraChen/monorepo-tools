import { existsSync } from 'node:fs';
import path from 'node:path';
import { findPackages } from '@pnpm/fs.find-packages';
import glob from 'fast-glob';
import { loadJsonFile } from 'load-json-file';
import { readConfig } from './utils';
import { parsePackage } from './validate';

/**
 * Checks if the specified directory is the root of a monorepo.
 * @param searchDir The directory to search for monorepo configuration files.
 * @returns A promise that resolves to `true` if the directory is a monorepo root, or `false` otherwise.
 */
export async function isRoot(searchDir: string): Promise<boolean> {
    const configFiles = ['pnpm-workspace.yaml', 'lerna.json'];
    const haveConfigFiles = configFiles.some((f) =>
        existsSync(path.join(searchDir, f)),
    );
    if (haveConfigFiles) {
        return true;
    }
    const packageJsonPath = path.join(searchDir, 'package.json');
    const json = await loadJsonFile(packageJsonPath);
    try {
        const pkg = parsePackage(json);
        if (pkg.workspaces) {
            return true;
        }
    } catch (error) {
        return false;
    }
    return false;
}

/**
 * Checks if a workspace directory is part of a monorepo.
 *
 * @param root - The root directory of the monorepo.
 * @param workspaceDir - The directory of the workspace to check.
 * @returns A boolean indicating whether the workspace is in a monorepo.
 */
export async function isInMonorepo(root: string, workspaceDir: string) {
    const relative = path.relative(root, workspaceDir);
    if (relative.startsWith('..')) {
        return false;
    }
    const { globs: config } = await readConfig(root);
    if (!config) {
        return false;
    }
    const packageDirs = await findPackages(root).then((packages) => {
        return packages.map((p) => p.rootDir);
    });
    for (const wDir of config) {
        const globResults = await glob(wDir, {
            cwd: root,
            onlyDirectories: true,
            absolute: true,
        });
        for (const globResult of globResults) {
            for (const projectDir of packageDirs) {
                if (globResult === projectDir) {
                    return true;
                }
            }
        }
    }
    return false;
}
