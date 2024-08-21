import { findPackages } from '@pnpm/fs.find-packages';
import type {
    Project,
    ProjectRootDir,
    ProjectRootDirRealPath,
} from '@pnpm/types';
import { findUp } from 'find-up';
import path from 'pathe';
import { readPackageUp } from 'read-package-up';
import { readPackage } from 'read-pkg';
import { Future } from 'sakiko';
import { isInMonorepo } from './is';
import type { PM } from './types';
import { readConfig, readPnpmWorkspaceYaml, resolve } from './utils';

/**
 * Finds the root directory of a monorepo or workspace based on the provided search directory and package manager.
 * @param searchDir The directory to start searching from.
 * @param packageManager The package manager used in the monorepo or workspace.
 * @returns The root directory of the monorepo or workspace.
 * @throws {Error} If no workspace root is found or if the directory is not in the workspace.
 */
export function findUpRoot(
    searchDir: string,
    packageManager: PM,
): Future<string> {
    return Future.from(async () => {
        // pnpm workspaces
        if (packageManager === 'pnpm') {
            const dir = await findUp('pnpm-workspace.yaml', {
                cwd: searchDir,
            }).then((dir) => {
                if (!dir) throw new Error('No workspace root found');
                return path.dirname(dir);
            });
            if (dir) {
                const config = await readPnpmWorkspaceYaml(dir);
                if (!config.packages)
                    throw new Error('No workspace config found');
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
        const results = await Promise.all(
            globs.map((d) => {
                const dir = path.join(root, d).replaceAll('*', '');
                return findPackages(dir);
            }),
        ).then((r) => r.flat());
        // yarn/npm workspaces seems can't find the root package, so add it manually
        results.push({
            rootDir: root as ProjectRootDir,
            rootDirRealPath: root as ProjectRootDirRealPath,
            manifest: {
                ...(await readPackage({ cwd: root })),
            },
            writeProjectManifest: () => {
                throw new Error('Not implemented');
            },
        } as Project);
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
