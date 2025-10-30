import { existsSync } from 'node:fs';
import path from 'pathe';
import { readPackage } from 'read-pkg';
import { Future } from 'sakiko';
import { glob } from 'tinyglobby';
import { readConfig } from './utils';

/**
 * Checks if the specified directory is the root of a monorepo.
 * @param searchDir The directory to search for monorepo configuration files.
 * @returns A promise that resolves to `true` if the directory is a monorepo root, or `false` otherwise.
 */
export function isRoot(searchDir: string): Future<boolean> {
    return Future.from(async () => {
        const configFiles = ['pnpm-workspace.yaml', 'lerna.json'];
        const haveConfigFiles = configFiles.some((f) =>
            existsSync(path.join(searchDir, f)),
        );
        if (haveConfigFiles) {
            return true;
        }
        const json = await readPackage({
            cwd: searchDir,
        });
        return !!json.workspaces;
    });
}

/**
 * Checks if a workspace directory is part of a monorepo.
 *
 * @param root - The root directory of the monorepo.
 * @param workspaceDir - The directory of the workspace to check.
 * @returns A boolean indicating whether the workspace is in a monorepo.
 */
export function isInMonorepo(
    root: string,
    workspaceDir: string,
): Future<boolean> {
    return Future.from(async () => {
        const relative = path.relative(root, workspaceDir);
        if (relative.startsWith('..')) {
            return false;
        }
        // If checking the root itself, it's always in the monorepo
        if (relative === '') {
            return true;
        }
        const { globs: config } = await readConfig(root);
        if (!config) {
            return false;
        }
        // Optimization: Use glob to find matching directories directly
        // instead of scanning all packages first
        const globResults = await glob(config, {
            cwd: root,
            onlyDirectories: true,
            absolute: true,
        });
        // Normalize paths and remove trailing slashes for comparison
        const normalizedWorkspaceDir = path
            .normalize(workspaceDir)
            .replace(/[/\\]+$/, '');
        // Check if workspaceDir matches any of the glob results
        // or is a subdirectory of a glob result
        for (const result of globResults) {
            const normalizedResult = path
                .normalize(result)
                .replace(/[/\\]+$/, '');
            if (
                normalizedWorkspaceDir === normalizedResult ||
                normalizedWorkspaceDir.startsWith(normalizedResult + path.sep)
            ) {
                return true;
            }
        }
        return false;
    });
}
