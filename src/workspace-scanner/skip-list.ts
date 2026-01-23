/**
 * Directories that should always be skipped during workspace scanning.
 * These are known build artifacts, dependencies, and tool directories
 * that never contain workspace packages.
 *
 * Using a Set for O(1) lookup performance vs regex matching.
 */
export const DEFAULT_SKIP_DIRS = new Set([
    // Package managers
    'node_modules',
    'bower_components',
    '.pnpm',
    '.yarn',
    '.npm',

    // Version control
    '.git',
    '.svn',
    '.hg',

    // Build outputs
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    '.output',
    '.turbo',
    '.cache',
    '.parcel-cache',

    // Test coverage
    'coverage',
    '.nyc_output',

    // IDE / Editor
    '.idea',
    '.vscode',
    '.fleet',

    // Temp / Logs
    // Documentation (usually not packages)
    'docs',
    'documentation',

    // Misc tool directories
    '__pycache__',
    '.tox',
    '.pytest_cache',
    '.mypy_cache',
    '.ruff_cache',
]);

/**
 * Fast O(1) check if directory should be skipped.
 *
 * @param dirName - The directory name (not full path)
 * @param additionalSkip - Optional additional directories to skip
 * @returns true if the directory should be skipped
 */
export function shouldSkip(
    dirName: string,
    additionalSkip?: Set<string>,
): boolean {
    // Fast path: check default skip list
    if (DEFAULT_SKIP_DIRS.has(dirName)) {
        return true;
    }

    // Check additional skip list if provided
    if (additionalSkip?.has(dirName)) {
        return true;
    }

    // Skip hidden directories (starting with .)
    // except for common workspace directories
    if (dirName.startsWith('.') && !isCommonWorkspaceDir(dirName)) {
        return true;
    }

    return false;
}

/**
 * Common workspace directory names that start with '.' but should NOT be skipped
 */
const COMMON_WORKSPACE_DIRS = new Set([
    '.github',
    '.changeset',
    '.storybook',
]);

function isCommonWorkspaceDir(dirName: string): boolean {
    return COMMON_WORKSPACE_DIRS.has(dirName);
}

/**
 * Create a merged skip set from default and additional directories
 */
export function createSkipSet(additionalDirs?: string[]): Set<string> {
    if (!additionalDirs || additionalDirs.length === 0) {
        return DEFAULT_SKIP_DIRS;
    }

    const merged = new Set(DEFAULT_SKIP_DIRS);
    for (const dir of additionalDirs) {
        merged.add(dir);
    }
    return merged;
}
