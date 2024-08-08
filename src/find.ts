import fs from 'node:fs/promises';
import path from 'node:path';
import { findPackages } from '@pnpm/fs.find-packages';
import type {
    Project,
    ProjectRootDir,
    ProjectRootDirRealPath,
} from '@pnpm/types';
import { findUp } from 'find-up';
import { loadJsonFile } from 'load-json-file';
import { type PackageJson, readPackageUp } from 'read-package-up';
import yaml from 'yaml';
import { isInMonorepo } from './is';
import type { PM } from './types';
import { readConfig, resolve } from './utils';

/**
 * Finds the root directory of a monorepo or workspace based on the provided search directory and package manager.
 * @param searchDir The directory to start searching from.
 * @param packageManager The package manager used in the monorepo or workspace.
 * @returns The root directory of the monorepo or workspace.
 * @throws {Error} If no workspace root is found or if the directory is not in the workspace.
 */
export async function findUpRoot(searchDir: string, packageManager: PM) {
    // pnpm workspaces
    if (packageManager === 'pnpm') {
        const dir = await findUp('pnpm-workspace.yaml', {
            cwd: searchDir,
        }).then((dir) => {
            if (!dir) throw new Error('No workspace root found');
            return path.dirname(dir);
        });
        if (dir) {
            const config = yaml.parse(
                await fs.readFile(
                    path.join(dir, 'pnpm-workspace.yaml'),
                    'utf-8',
                ),
            );
            if (!config.packages) throw new Error('No workspace config found');
            if (await isInMonorepo(dir, searchDir)) return dir;
        }
        throw new Error('No workspace root found');
    }

    // yarn/npm workspaces
    let cwd = searchDir;
    while (true) {
        const pkg = await readPackageUp({ cwd: cwd });
        if (!pkg) throw new Error('No package.json root found');
        cwd = path.dirname(pkg.path);
        if (pkg.packageJson.workspaces) {
            if (await isInMonorepo(cwd, searchDir)) return cwd;
            throw new Error('This directory is not in the workspace');
        }
        cwd = resolve(cwd, '..');
    }
}

/**
 * Finds the path to the root package.json file by searching upwards from the specified directory.
 *
 * @param searchDir - The directory to start the search from.
 * @param packageManager - The package manager to use for the search (e.g., "npm", "yarn").
 * @returns The path to the root package.json file.
 */
async function locateRootPackage(searchDir: string, packageManager: PM) {
    const root = await findUpRoot(searchDir, packageManager);
    return path.join(root, 'package.json');
}

/**
 * Finds all projects within a monorepo.
 *
 * @param searchDir - The directory to start searching from. Defaults to the current working directory.
 * @param packageManager - The package manager to use. If not provided, it will be determined automatically.
 * @returns A promise that resolves to an array of project objects.
 * @throws An error if no workspace root is found.
 */
export async function scanProjects(searchDir: string, packageManager: PM) {
    const rootPackageJson = await locateRootPackage(searchDir, packageManager);
    if (packageManager === 'pnpm') {
        const rootPath = path.dirname(rootPackageJson);
        return await findPackages(rootPath);
    }
    const { globs } = await readConfig(path.dirname(rootPackageJson));
    if (!globs) {
        throw new Error('No workspace root found');
    }
    const results = await Promise.all(
        globs.map((d) => {
            const dir = path
                .join(path.dirname(rootPackageJson), d)
                .replaceAll('*', '');
            return findPackages(dir);
        }),
    );
    // yarn/npm workspaces seems can't find the root package, so add it manually
    results.push([
        {
            rootDir: path.dirname(rootPackageJson) as ProjectRootDir,
            rootDirRealPath: path.dirname(
                rootPackageJson,
            ) as ProjectRootDirRealPath,
            manifest: {
                ...(await loadJsonFile<PackageJson>(rootPackageJson)),
            },
            writeProjectManifest: () => {
                throw new Error('Not implemented');
            },
        } as Project,
    ]);
    return results.flat();
}
