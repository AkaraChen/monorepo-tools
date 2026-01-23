import { readFile } from 'node:fs/promises';
import * as yaml from '@akrc/yaml';
import path from 'pathe';
import { Future, Option, Result } from 'sakiko';
import type { PackageJson } from './types';
import { readPackage } from './vendor/read-pkg';
import { detectPMByLock } from './pm';
import type { PM, PnpmWorkspaceYaml } from './types';

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
        const pnpm = await readPnpmWorkspaceYaml(root).result();
        if (pnpm.isOk()) {
            const globs = pnpm.unwrap().packages;
            if (globs) {
                return { pm: 'pnpm' as PM, globs };
            }
            throw new Error('Invalid pnpm-workspace.yaml');
        }
        const pkg = await readPackage({ cwd: root });
        const globs = parseWorkspaceOption(pkg).unwrap();
        const pm = detectPMByLock(root).unwrap();
        return { pm, globs };
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
