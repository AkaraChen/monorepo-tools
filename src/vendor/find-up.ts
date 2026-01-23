import { existsSync, statSync } from 'node:fs';
import path from 'pathe';

export interface FindUpOptions {
    cwd?: string;
    type?: 'file' | 'directory';
}

export async function findUp(
    name: string,
    options: FindUpOptions = {},
): Promise<string | undefined> {
    let dir = path.resolve(options.cwd ?? process.cwd());
    const { root } = path.parse(dir);
    const type = options.type ?? 'file';

    while (true) {
        const target = path.join(dir, name);
        if (existsSync(target)) {
            try {
                const stat = statSync(target);
                const isMatch =
                    type === 'directory' ? stat.isDirectory() : stat.isFile();
                if (isMatch) {
                    return target;
                }
            } catch {
                // Ignore stat errors
            }
        }

        if (dir === root) break;
        const parentDir = path.dirname(dir);
        if (parentDir === dir) break;
        dir = parentDir;
    }

    return undefined;
}
