import { readFile } from 'node:fs/promises';
import * as yaml from '@akrc/yaml';
import path from 'pathe';
import type { PackageJson } from 'read-package-up';
import { readPackage } from 'read-pkg';
import { Future, Option, Result } from 'sakiko';
import { detectPMByLock } from './pm';
import type { PM, PnpmWorkspaceYaml } from './types';

// Simple cache for config results
const configCache = new Map<string, { pm: PM; globs: string[] }>();

export function resolve(input: string, ...args: string[]): Result<string> {
    const result = path.resolve(input, ...args);
    if (path.normalize(input) === path.normalize(result)) {
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
        // Check cache first
        const normalizedRoot = path.normalize(root);
        const cached = configCache.get(normalizedRoot);
        if (cached) {
            return cached;
        }

        const pnpm = await readPnpmWorkspaceYaml(root).result();
        if (pnpm.isOk()) {
            const globs = pnpm.unwrap().packages;
            if (globs) {
                const config = { pm: 'pnpm' as PM, globs };
                configCache.set(normalizedRoot, config);
                return config;
            }
            throw new Error('Invalid pnpm-workspace.yaml');
        }
        const pkg = await readPackage({ cwd: root });
        const globs = parseWorkspaceOption(pkg).unwrap();
        const pm = detectPMByLock(root).unwrap();
        const config = { pm, globs };
        configCache.set(normalizedRoot, config);
        return config;
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
