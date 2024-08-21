import { existsSync } from 'node:fs';
import path from 'pathe';
import { Option } from 'sakiko';
import type { PM } from './types';

/**
 * Retrieves the package manager name based on the user agent.
 * @returns The package manager name.
 * @throws Throws an error if the package manager is unknown.
 */
export function detectPMByUA(): Option<PM> {
    const packageManager = process.env.npm_config_user_agent || '';
    for (const key of ['npm', 'pnpm', 'yarn'] as const) {
        if (packageManager.startsWith(key)) {
            return Option.some(key);
        }
    }
    return Option.none();
}

/**
 * Determines the package manager used in a given directory based on the presence of lock files.
 * @param searchDir - The directory to search for lock files.
 * @returns A Promise that resolves to the name of the package manager.
 * @throws An error if the package manager cannot be determined.
 */
export function detectPMByLock(searchDir: string): Option<PM> {
    const dir = searchDir;
    const map: Record<string, PM> = {
        'pnpm-lock.yaml': 'pnpm',
        'yarn.lock': 'yarn',
        'package-lock.json': 'npm',
    };
    for (const [file, pm] of Object.entries(map)) {
        if (existsSync(path.join(dir, file))) {
            return Option.some(pm);
        }
    }
    return Option.none();
}

/**
 * Retrieves the package manager name based on the provided search directory.
 * If the package manager cannot be determined by the lockfile, it falls back to the user agent.
 *
 * @param searchDir - The directory to search for the lockfile.
 * @returns A Promise that resolves to the package manager name.
 */
export function detectPM(searchDir: string): Option<PM> {
    return detectPMByLock(searchDir).mapOr(Option.none(), (pm) =>
        Option.some(pm),
    );
}
