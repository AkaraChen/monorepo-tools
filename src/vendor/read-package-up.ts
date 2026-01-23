import { existsSync } from 'node:fs';
import path from 'pathe';
import type { PackageJson } from '../types';
import { readPackage } from './read-pkg';

export interface ReadPackageUpOptions {
    cwd?: string;
}

export interface ReadPackageUpResult {
    packageJson: PackageJson;
    path: string;
}

export async function readPackageUp(
    options: ReadPackageUpOptions = {},
): Promise<ReadPackageUpResult | undefined> {
    let dir = path.resolve(options.cwd ?? process.cwd());
    const { root } = path.parse(dir);

    while (dir !== root) {
        const pkgPath = path.join(dir, 'package.json');
        if (existsSync(pkgPath)) {
            const packageJson = await readPackage({ cwd: dir });
            return { packageJson, path: pkgPath };
        }
        const parentDir = path.dirname(dir);
        if (parentDir === dir) break;
        dir = parentDir;
    }

    // Check root directory
    const pkgPath = path.join(root, 'package.json');
    if (existsSync(pkgPath)) {
        const packageJson = await readPackage({ cwd: root });
        return { packageJson, path: pkgPath };
    }

    return undefined;
}
