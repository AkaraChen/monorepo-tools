import { readFile } from 'node:fs/promises';
import * as yaml from '@akrc/yaml';
import path from 'pathe';
import { glob } from 'tinyglobby';
import type { PackageJson, PnpmWorkspaceYaml, Project } from '../types';

export async function findPackages(root: string): Promise<Project[]> {
    // 1. Read pnpm-workspace.yaml to get patterns
    const yamlPath = path.join(root, 'pnpm-workspace.yaml');
    const content = await readFile(yamlPath, 'utf-8');
    const workspace = yaml.load(content) as PnpmWorkspaceYaml;
    const patterns = workspace.packages ?? [];

    // 2. Use glob to find all package.json files
    const pkgPatterns = patterns.map((p) =>
        path.join(root, p, 'package.json').replace(/\\/g, '/'),
    );

    const pkgPaths = await glob(pkgPatterns, {
        ignore: ['**/node_modules/**', '**/bower_components/**'],
        absolute: true,
        onlyFiles: true,
    });

    // 3. Read all package.json files in parallel and construct Project objects
    const projects = await Promise.all(
        pkgPaths.map(async (manifestPath) => {
            const rootDir = path.dirname(manifestPath);
            const manifestContent = await readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent) as PackageJson;
            return {
                rootDir,
                manifest,
            } as Project;
        }),
    );

    // 4. Add root project
    const rootPkgPath = path.join(root, 'package.json');
    const rootManifestContent = await readFile(rootPkgPath, 'utf-8');
    const rootManifest = JSON.parse(rootManifestContent) as PackageJson;
    projects.push({
        rootDir: root,
        manifest: rootManifest,
    });

    return projects;
}
