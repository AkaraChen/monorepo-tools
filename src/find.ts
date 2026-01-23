import path from 'pathe';
import { Future } from 'sakiko';
import { glob } from 'tinyglobby';
import { globResultCache } from './cache';
import { isInMonorepo, isInWorkspace } from './is';
import type { PM, Project } from './types';
import { parseWorkspaceOption, readConfig, resolve } from './utils';
import { findPackages } from './vendor/find-packages';
import { findUp } from './vendor/find-up';
import { readPackageUp } from './vendor/read-package-up';
import { readPackage } from './vendor/read-pkg';

/**
 * Finds all packages in a workspace by searching for package.json files matching the given glob patterns.
 * @param root The root directory of the workspace.
 * @param globs The glob patterns to search for packages (e.g., ['packages/*']).
 * @returns An array of Project objects found in the workspace.
 */
async function findPackagesInWorkspace(
    root: string,
    globs: string[],
): Promise<Project[]> {
    // Convert globs to package.json search patterns
    const patterns = globs.map((g) =>
        path.join(root, g, 'package.json').replace(/\\/g, '/'),
    );

    // Find all package.json files with caching
    const cacheKey = `pkg:${root}:${patterns.join(',')}`;
    let packageJsonPaths = globResultCache.get(cacheKey);
    if (!packageJsonPaths) {
        packageJsonPaths = await glob(patterns, {
            ignore: ['**/node_modules/**', '**/bower_components/**'],
            absolute: true,
            onlyFiles: true,
        });
        globResultCache.set(cacheKey, packageJsonPaths);
    }

    // Read each package.json and create Project objects (uses packageJsonCache)
    const projects = await Promise.all(
        packageJsonPaths.map(async (manifestPath) => {
            const rootDir = path.dirname(manifestPath);
            const manifest = await readPackage({ cwd: rootDir });

            return {
                rootDir,
                manifest,
            } as Project;
        }),
    );

    return projects;
}

/**
 * Finds the root directory of a monorepo or workspace based on the provided search directory and package manager.
 * @param searchDir The directory to start searching from.
 * @param packageManager The package manager used in the monorepo or workspace.
 * @returns The root directory of the monorepo or workspace.
 * @throws {Error} If no workspace root is found or if the directory is not in the workspace.
 */
export function findUpRoot(
    searchDir: string,
    packageManager?: PM,
): Future<string> {
    return Future.from(async () => {
        // pnpm workspaces
        if (
            // if not specified, or explicitly set to pnpm
            typeof packageManager === 'undefined' ||
            packageManager === 'pnpm'
        ) {
            const pnpmYamlDir = await findUp('pnpm-workspace.yaml', {
                cwd: searchDir,
            });
            if (pnpmYamlDir) {
                const dirname = path.dirname(pnpmYamlDir);
                const isRoot = await isInMonorepo(dirname, searchDir);
                if (isRoot) return dirname;
            }
            // if not specified pm, just jump to the next
            if (packageManager === 'pnpm') {
                throw new Error('No workspace root found');
            }
        }

        // yarn/npm workspaces
        let cwd = searchDir;
        while (true) {
            const pkg = await readPackageUp({ cwd: cwd });
            if (!pkg) throw new Error('No package.json root found');
            cwd = path.dirname(pkg.path);
            if (pkg.packageJson.workspaces) {
                // Instead of calling isInMonorepo (which calls readConfig),
                // use the workspace info we already have
                const globs = parseWorkspaceOption(pkg.packageJson).unwrap();
                const isRoot = await isInWorkspace(cwd, searchDir, globs);
                if (isRoot) return cwd;
                throw new Error('This directory is not in the workspace');
            }
            cwd = resolve(cwd, '..').unwrap();
        }
    });
}

/**
 * Finds all projects within a monorepo.
 *
 * @param searchDir - The directory to start searching from. Defaults to the current working directory.
 * @param packageManager - The package manager to use. If not provided, it will be determined automatically.
 * @returns A promise that resolves to an array of project objects.
 * @throws An error if no workspace root is found.
 */
export function scanProjects(
    searchDir: string,
    packageManager: PM,
): Future<Project[]> {
    return Future.from(async () => {
        const root = await findUpRoot(searchDir, packageManager);
        if (packageManager === 'pnpm') {
            return await findPackages(root);
        }
        const { globs } = await readConfig(root);
        if (!globs) {
            throw new Error('No workspace root found');
        }
        const results = await findPackagesInWorkspace(root, globs);
        // yarn/npm workspaces seems can't find the root package, so add it manually
        results.push({
            rootDir: root,
            manifest: await readPackage({ cwd: root }),
        });
        return results;
    });
}

/**
 * Finds the root directory of a repository.
 *
 * @param searchDir - The directory to start searching from.
 * @returns The absolute path of the repository root directory.
 * @throws Error if no git root is found.
 */
export function findRepoRoot(searchDir: string): Future<string> {
    return Future.from(async () => {
        const gitDir = await findUp('.git', {
            cwd: searchDir,
            type: 'directory',
        });
        if (!gitDir) throw new Error('No git root found');
        return path.resolve(gitDir, '..');
    });
}
