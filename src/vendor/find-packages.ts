import type { Project } from '../types';
import { readConfig } from '../utils';
import { findPackageJsonPaths } from '../workspace-scanner';
import { readPackage } from './read-pkg';

export async function findPackages(root: string): Promise<Project[]> {
    // 1. Read pnpm-workspace.yaml to get patterns (uses configCache)
    const { globs: patterns } = await readConfig(root);

    // 2. Find all package.json files using custom scanner (with caching)
    const pkgPaths = await findPackageJsonPaths(root, patterns, { cache: true });

    // 3. Read all package.json files in parallel (uses packageJsonCache)
    const projects = await Promise.all(
        pkgPaths.map(async (manifestPath) => {
            const rootDir = manifestPath.replace(/\/package\.json$/, '');
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
