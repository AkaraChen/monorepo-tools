import { readFile } from 'node:fs/promises';
import path from 'pathe';
import { packageJsonCache } from '../cache';
import type { PackageJson } from '../types';

export interface ReadPackageOptions {
    cwd?: string;
}

export async function readPackage(
    options: ReadPackageOptions = {},
): Promise<PackageJson> {
    const cwd = options.cwd ?? process.cwd();
    const filePath = path.join(cwd, 'package.json');

    // Check cache first
    const cached = packageJsonCache.get(filePath);
    if (cached) {
        return cached as PackageJson;
    }

    const content = await readFile(filePath, 'utf-8');
    const pkg = JSON.parse(content) as PackageJson;

    // Cache the result
    packageJsonCache.set(filePath, pkg);

    return pkg;
}
