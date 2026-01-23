import { existsSync } from 'node:fs';
import path from 'pathe';
import { Future } from 'sakiko';
import { readConfig } from './utils';
import { readPackage } from './vendor/read-pkg';
import { matchPattern, parsePattern } from './workspace-scanner/pattern';

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
 * Checks if a workspace directory matches the given glob patterns.
 * This is a lower-level function that doesn't read config files.
 *
 * @param root - The root directory of the monorepo.
 * @param workspaceDir - The directory of the workspace to check.
 * @param globs - The glob patterns to match against.
 * @returns A boolean indicating whether the workspace matches the patterns.
 */
export async function isInWorkspace(
    root: string,
    workspaceDir: string,
    globs: string[],
): Promise<boolean> {
    const relative = path.relative(root, workspaceDir);
    if (relative.startsWith('..')) {
        return false;
    }
    // If checking the root itself, it's always in the monorepo
    if (relative === '') {
        return true;
    }

    // Parse patterns and check if workspaceDir matches any
    const parsedPatterns = globs
        .filter((g) => !g.startsWith('!')) // Ignore negation patterns for this check
        .map(parsePattern);

    // Check if workspaceDir matches any positive pattern
    for (const pattern of parsedPatterns) {
        if (matchPattern(pattern, relative)) {
            return true;
        }
        // Also check if workspaceDir is a subdirectory of a pattern match
        // e.g., pattern "packages/*" should match "packages/foo/src"
        if (pattern.maxDepth !== -1) {
            // For single-level patterns like packages/*, check if relative starts with a match
            const parts = relative.split('/');
            if (parts.length >= pattern.segments.length) {
                const truncatedPath = parts.slice(0, pattern.segments.length).join('/');
                if (matchPattern(pattern, truncatedPath)) {
                    return true;
                }
            }
        }
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
export function isInMonorepo(
    root: string,
    workspaceDir: string,
): Future<boolean> {
    return Future.from(async () => {
        const { globs: config } = await readConfig(root);
        if (!config) {
            return false;
        }
        return isInWorkspace(root, workspaceDir, config);
    });
}
