import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'pathe';
import type { PackageJson } from 'read-package-up';
import { readPackage } from 'read-pkg';
import { Future, Option, Result } from 'sakiko';
import yaml from 'yaml';
import type { PM, PnpmWorkspaceYaml } from './types';

export function resolve(lastResult: string, ...args: string[]): Result<string> {
    const result = path.resolve(lastResult, ...args);
    if (lastResult === result) {
        return Result.err(new Error('Could not resolve path'));
    }
    return Result.ok(result);
}

function parseWorkspaceOption(packageJson: PackageJson): Option<string[]> {
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
                return { pm: 'pnpm', globs };
            }
        }

        const pkg = await readPackage({ cwd: root });
        const globs = parseWorkspaceOption(pkg).unwrap();
        return { pm: 'yarn' as PM, globs };
    });
}

function readYaml<T>(file: string): Future<T> {
    return Future.from(async () => {
        const content = await readFile(file, 'utf-8');
        return yaml.parse(content) as T;
    });
}

export function readPnpmWorkspaceYaml(
    dir: string,
): Future<Partial<PnpmWorkspaceYaml>> {
    return Future.from(readYaml(path.join(dir, 'pnpm-workspace.yaml')));
}
