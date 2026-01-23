import { globResultCache } from '../cache';
import type { Project } from '../types';
import { readPackage } from '../vendor/read-pkg';
import type { ScanStats } from './scanner';
import { scanWorkspacePatterns } from './scanner';

export interface ScanWorkspaceOptions {
    /** Root directory of the workspace */
    root: string;
    /** Workspace patterns (e.g., ['packages/*', 'apps/**']) */
    patterns: string[];
    /** Additional directories to skip (merged with defaults) */
    additionalSkipDirs?: string[];
    /** Enable/disable caching (default: true) */
    cache?: boolean;
    /** Include statistics in result (default: false) */
    includeStats?: boolean;
}

export interface ScanWorkspaceResult {
    /** Found projects with their manifests */
    projects: Project[];
    /** Scan statistics (if includeStats: true) */
    stats?: ScanStats;
}

/**
 * Create a cache key for workspace scan results
 */
function createCacheKey(root: string, patterns: string[]): string {
    return `ws:${root}:${patterns.sort().join(',')}`;
}

/**
 * Find all package.json paths matching workspace patterns.
 * This is a low-level function that only returns paths without reading manifests.
 *
 * @example
 * const paths = await findPackageJsonPaths('/path/to/monorepo', ['packages/*', 'apps/**']);
 * // ['/path/to/monorepo/packages/a/package.json', ...]
 */
export async function findPackageJsonPaths(
    root: string,
    patterns: string[],
    options?: {
        additionalSkipDirs?: string[];
        cache?: boolean;
    },
): Promise<string[]> {
    const useCache = options?.cache !== false;

    if (useCache) {
        const cacheKey = createCacheKey(root, patterns);
        const cached = globResultCache.get(cacheKey);
        if (cached) {
            return cached;
        }

        const { paths } = await scanWorkspacePatterns({
            root,
            patterns,
            additionalSkipDirs: options?.additionalSkipDirs,
        });

        globResultCache.set(cacheKey, paths);
        return paths;
    }

    const { paths } = await scanWorkspacePatterns({
        root,
        patterns,
        additionalSkipDirs: options?.additionalSkipDirs,
    });

    return paths;
}

/**
 * Scan workspace for packages using optimized directory traversal.
 * Returns Project objects with their manifests loaded.
 *
 * @example
 * const { projects } = await scanWorkspace({
 *   root: '/path/to/monorepo',
 *   patterns: ['packages/*', 'apps/**'],
 * });
 *
 * @example With negation
 * const { projects } = await scanWorkspace({
 *   root: '/path/to/monorepo',
 *   patterns: ['packages/*', '!packages/internal'],
 * });
 *
 * @example With statistics
 * const { projects, stats } = await scanWorkspace({
 *   root: '/path/to/monorepo',
 *   patterns: ['packages/*'],
 *   includeStats: true,
 * });
 * console.log(`Scanned ${stats.dirsScanned} dirs in ${stats.elapsedMs}ms`);
 */
export async function scanWorkspace(
    options: ScanWorkspaceOptions,
): Promise<ScanWorkspaceResult> {
    const { root, patterns, additionalSkipDirs, includeStats } = options;
    const useCache = options.cache !== false;

    // Get package.json paths (may be cached)
    let paths: string[];
    let stats: ScanStats | undefined;

    if (useCache) {
        const cacheKey = createCacheKey(root, patterns);
        const cached = globResultCache.get(cacheKey);

        if (cached) {
            paths = cached;
        } else {
            const result = await scanWorkspacePatterns({
                root,
                patterns,
                additionalSkipDirs,
            });
            paths = result.paths;
            stats = result.stats;
            globResultCache.set(cacheKey, paths);
        }
    } else {
        const result = await scanWorkspacePatterns({
            root,
            patterns,
            additionalSkipDirs,
        });
        paths = result.paths;
        stats = result.stats;
    }

    // Read package.json files and construct Project objects
    const projects = await Promise.all(
        paths.map(async (pkgPath) => {
            const rootDir = pkgPath.replace(/\/package\.json$/, '');
            const manifest = await readPackage({ cwd: rootDir });
            return { rootDir, manifest } as Project;
        }),
    );

    const result: ScanWorkspaceResult = { projects };
    if (includeStats && stats) {
        result.stats = stats;
    }

    return result;
}

// Re-export types and utilities
export type { ScanStats } from './scanner';
export { DEFAULT_SKIP_DIRS, shouldSkip } from './skip-list';
export { parsePattern, type ParsedPattern } from './pattern';
