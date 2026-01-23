import path from 'pathe';
import { glob } from 'tinyglobby';
import { globResultCache } from '../cache';
import type { Project } from '../types';
import { readConfig } from '../utils';
import { readPackage } from './read-pkg';

export async function findPackages(root: string): Promise<Project[]> {
    // 1. Read pnpm-workspace.yaml to get patterns (uses configCache)
    const { globs: patterns } = await readConfig(root);

    // 2. Use glob to find all package.json files (with caching)
    const pkgPatterns = patterns.map((p) =>
        path.join(root, p, 'package.json').replace(/\\/g, '/'),
    );

    const cacheKey = `pkg:${root}:${pkgPatterns.join(',')}`;
    let pkgPaths = globResultCache.get(cacheKey);
    if (!pkgPaths) {
        pkgPaths = await glob(pkgPatterns, {
            ignore: ['**/node_modules/**', '**/bower_components/**'],
            absolute: true,
            onlyFiles: true,
        });
        globResultCache.set(cacheKey, pkgPaths);
    }

    // 3. Read all package.json files in parallel (uses packageJsonCache)
    const projects = await Promise.all(
        pkgPaths.map(async (manifestPath) => {
            const rootDir = path.dirname(manifestPath);
            const manifest = await readPackage({ cwd: rootDir });
            return {
                rootDir,
                manifest,
            } as Project;
        }),
    );

    // 4. Add root project (uses packageJsonCache)
    const rootManifest = await readPackage({ cwd: root });
    projects.push({
        rootDir: root,
        manifest: rootManifest,
    });

    return projects;
}
