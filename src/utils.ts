import { readFile } from 'node:fs/promises';
import * as yaml from '@akrc/yaml';
import path from 'pathe';
import { Future, Option, Result } from 'sakiko';
import { configCache } from './cache';
import { detectPMByLock } from './pm';
import type { PM, PackageJson, PnpmWorkspaceYaml } from './types';
import { readPackage } from './vendor/read-pkg';

export function resolve(input: string, ...args: string[]): Result<string> {
    const result = path.resolve(input, ...args);
    if (path.normalize(input) === path.normalize(result)) {
        return Result.err(new Error('Could not resolve path'));
    }
    return Result.ok(result);
}

export function parseWorkspaceOption(
    packageJson: PackageJson,
): Option<string[]> {
    if (packageJson.workspaces) {
        const workspaces = packageJson.workspaces;
        const workspaceDirs = Array.isArray(workspaces)
            ? workspaces
            : workspaces.packages;
        if (!workspaceDirs) {
            return Option.none();
        }
        return Option.some(workspaceDirs);
    }
    return Option.none();
}

/**
 * Retrieves the monorepo configuration for a given workspace root.
 * @param root The root directory of the workspace.
 * @returns The monorepo configuration object.
 * @throws Error if no monorepo configuration is found.
 */
export function readConfig(root: string): Future<{
    pm: PM;
    globs: string[];
}> {
    return Future.from(async () => {
        // Check cache first
        const cached = configCache.get(root);
        if (cached) {
            return cached as { pm: PM; globs: string[] };
        }

        let result: { pm: PM; globs: string[] };

        const pnpm = await readPnpmWorkspaceYaml(root).result();
        if (pnpm.isOk()) {
            const globs = pnpm.unwrap().packages;
            if (globs) {
                result = { pm: 'pnpm' as PM, globs };
            } else {
                throw new Error('Invalid pnpm-workspace.yaml');
            }
        } else {
            const pkg = await readPackage({ cwd: root });
            const globs = parseWorkspaceOption(pkg).unwrap();
            const pm = detectPMByLock(root).unwrap();
            result = { pm, globs };
        }

        // Cache the result
        configCache.set(root, result);
        return result;
    });
}

function readYaml<T>(file: string): Future<T> {
    return Future.from(async () => {
        const content = await readFile(file, 'utf-8');
        return yaml.load(content) as T;
    });
}

export function readPnpmWorkspaceYaml(
    dir: string,
): Future<Partial<PnpmWorkspaceYaml>> {
    return Future.from(readYaml(path.join(dir, 'pnpm-workspace.yaml')));
}
