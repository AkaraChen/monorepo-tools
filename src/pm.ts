import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { PM } from './types';

/**
 * Retrieves the package manager name based on the user agent.
 * @returns The package manager name.
 * @throws Throws an error if the package manager is unknown.
 */
export function detectPMByUA(): PM {
    const packageManager = process.env.npm_config_user_agent || '';
    for (const key of ['npm', 'pnpm', 'yarn'] as const) {
        if (packageManager.startsWith(key)) {
            return key;
        }
    }
    throw new Error('Unknown package manager');
}

/**
 * Determines the package manager used in a given directory based on the presence of lock files.
 * @param searchDir - The directory to search for lock files.
 * @returns A Promise that resolves to the name of the package manager.
 * @throws An error if the package manager cannot be determined.
 */
export async function detectPMByLock(searchDir: string): Promise<PM> {
    const dir = searchDir;
    if (existsSync(join(dir, 'yarn.lock'))) {
        return 'yarn';
    }
    if (existsSync(join(dir, 'pnpm-lock.yaml'))) {
        return 'pnpm';
    }
    if (existsSync(join(dir, 'package-lock.json'))) {
        return 'npm';
    }
    throw new Error('Unknown package manager');
}

/**
 * Retrieves the package manager name based on the provided search directory.
 * If the package manager cannot be determined by the lockfile, it falls back to the user agent.
 *
 * @param searchDir - The directory to search for the lockfile.
 * @returns A Promise that resolves to the package manager name.
 */
export async function detectPM(searchDir: string): Promise<PM> {
    try {
        return await detectPMByLock(searchDir);
    } catch {
        return detectPMByUA();
    }
}
