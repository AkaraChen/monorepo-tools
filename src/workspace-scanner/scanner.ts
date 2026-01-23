import { access, constants, readdir } from 'node:fs/promises';
import path from 'pathe';
import type { ParsedPattern } from './pattern';
import { matchPattern, parsePatterns } from './pattern';
import { createSkipSet, shouldSkip } from './skip-list';

export interface ScanOptions {
    /** Root directory to start scanning from */
    root: string;
    /** Workspace patterns (e.g., ['packages/*', 'apps/**']) */
    patterns: string[];
    /** Additional directories to skip */
    additionalSkipDirs?: string[];
}

export interface ScanStats {
    dirsScanned: number;
    filesChecked: number;
    skipped: number;
    elapsedMs: number;
}

/**
 * Fast file existence check using access()
 */
async function exists(filePath: string): Promise<boolean> {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

/**
 * Scan a single level of directories for package.json files.
 * Optimized for patterns like `packages/*` where we only need to check
 * direct children of a directory.
 */
async function scanSingleLevel(
    dir: string,
    skipSet: Set<string>,
    stats: ScanStats,
): Promise<string[]> {
    const results: string[] = [];

    let entries: { name: string; isDirectory: () => boolean }[];
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        // Directory doesn't exist or can't be read
        return results;
    }

    stats.dirsScanned++;

    // Filter and check in parallel
    const checks = entries
        .filter((entry) => {
            if (!entry.isDirectory()) return false;
            if (shouldSkip(String(entry.name), skipSet)) {
                stats.skipped++;
                return false;
            }
            return true;
        })
        .map(async (entry) => {
            const entryName = String(entry.name);
            const pkgPath = path.join(dir, entryName, 'package.json');
            stats.filesChecked++;
            if (await exists(pkgPath)) {
                return pkgPath;
            }
            return null;
        });

    const checked = await Promise.all(checks);
    for (const result of checked) {
        if (result) results.push(result);
    }

    return results;
}

/**
 * Recursively scan directories for package.json files.
 * Used for patterns like `packages/**` that need to check all subdirectories.
 */
async function scanRecursive(
    dir: string,
    maxDepth: number,
    skipSet: Set<string>,
    stats: ScanStats,
    depth = 0,
): Promise<string[]> {
    // Depth limit check (maxDepth -1 means unlimited)
    if (maxDepth !== -1 && depth > maxDepth) {
        return [];
    }

    const results: string[] = [];

    let entries: { name: string; isDirectory: () => boolean }[];
    try {
        entries = await readdir(dir, { withFileTypes: true });
    } catch {
        // Directory doesn't exist or can't be read
        return results;
    }

    stats.dirsScanned++;

    // Process directories
    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const entryName = String(entry.name);
        if (shouldSkip(entryName, skipSet)) {
            stats.skipped++;
            continue;
        }

        const subDir = path.join(dir, entryName);
        const pkgPath = path.join(subDir, 'package.json');

        stats.filesChecked++;
        if (await exists(pkgPath)) {
            results.push(pkgPath);
        }

        // Continue recursing
        const subResults = await scanRecursive(
            subDir,
            maxDepth,
            skipSet,
            stats,
            depth + 1,
        );
        results.push(...subResults);
    }

    return results;
}

/**
 * Scan for a specific pattern
 */
async function scanPattern(
    root: string,
    pattern: ParsedPattern,
    skipSet: Set<string>,
    stats: ScanStats,
): Promise<string[]> {
    // Start from the static prefix to minimize traversal
    const startDir = pattern.staticPrefix
        ? path.join(root, pattern.staticPrefix)
        : root;

    // Check if start directory exists
    if (!(await exists(startDir))) {
        return [];
    }

    if (pattern.maxDepth === 1) {
        // Single-level pattern (e.g., packages/*)
        return scanSingleLevel(startDir, skipSet, stats);
    }

    // Recursive pattern (e.g., packages/**)
    return scanRecursive(startDir, pattern.maxDepth, skipSet, stats);
}

/**
 * Filter results by negation patterns
 */
function filterByNegations(
    results: string[],
    root: string,
    negativePatterns: ParsedPattern[],
): string[] {
    if (negativePatterns.length === 0) {
        return results;
    }

    return results.filter((pkgPath) => {
        // Get relative path from root to package directory
        const pkgDir = path.dirname(pkgPath);
        const relativePath = path.relative(root, pkgDir);

        // Check if any negation pattern matches
        for (const negPattern of negativePatterns) {
            if (matchPattern(negPattern, relativePath)) {
                return false; // Exclude this result
            }
        }
        return true;
    });
}

/**
 * Deduplicate results (in case multiple patterns match the same package)
 */
function deduplicate(results: string[]): string[] {
    return [...new Set(results)];
}

/**
 * Main scanning function that processes all patterns
 */
export async function scanWorkspacePatterns(
    options: ScanOptions,
): Promise<{ paths: string[]; stats: ScanStats }> {
    const startTime = performance.now();
    const stats: ScanStats = {
        dirsScanned: 0,
        filesChecked: 0,
        skipped: 0,
        elapsedMs: 0,
    };

    const { positive, negative } = parsePatterns(options.patterns);
    const skipSet = createSkipSet(options.additionalSkipDirs);

    // Scan all positive patterns
    const allResults: string[] = [];
    for (const pattern of positive) {
        const results = await scanPattern(options.root, pattern, skipSet, stats);
        allResults.push(...results);
    }

    // Apply negation filters
    const filtered = filterByNegations(allResults, options.root, negative);

    // Deduplicate and return
    const paths = deduplicate(filtered);

    stats.elapsedMs = performance.now() - startTime;

    return { paths, stats };
}
