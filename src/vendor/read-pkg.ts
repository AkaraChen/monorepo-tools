import { readFile, readFileSync } from 'node:fs';
import { promisify } from 'node:util';
import path from 'pathe';
import type { PackageJson } from '../types';

const readFileAsync = promisify(readFile);

export interface ReadPackageOptions {
    cwd?: string;
}

export async function readPackage(
    options: ReadPackageOptions = {},
): Promise<PackageJson> {
    const cwd = options.cwd ?? process.cwd();
    const filePath = path.join(cwd, 'package.json');
    const content = await readFileAsync(filePath, 'utf-8');
    return JSON.parse(content) as PackageJson;
}

export function readPackageSync(options: ReadPackageOptions = {}): PackageJson {
    const cwd = options.cwd ?? process.cwd();
    const filePath = path.join(cwd, 'package.json');
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as PackageJson;
}
