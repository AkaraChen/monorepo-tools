/**
 * Parsed workspace pattern representation
 */
export interface ParsedPattern {
    /** Original pattern string */
    raw: string;
    /** Pattern segments split by '/' */
    segments: PatternSegment[];
    /** Is this a negation pattern (starts with !) */
    isNegation: boolean;
    /** Fixed prefix path before any wildcards */
    staticPrefix: string;
    /** Maximum traversal depth (-1 for unlimited with **) */
    maxDepth: number;
}

export type PatternSegment =
    | { type: 'literal'; value: string }
    | { type: 'wildcard' } // *
    | { type: 'globstar' }; // **

/**
 * Parse a workspace pattern into structured representation
 *
 * @example
 * parsePattern('packages/*')
 * // { segments: [literal("packages"), wildcard], staticPrefix: "packages", maxDepth: 1 }
 *
 * @example
 * parsePattern('apps/**')
 * // { segments: [literal("apps"), globstar], staticPrefix: "apps", maxDepth: -1 }
 *
 * @example
 * parsePattern('!packages/internal')
 * // { isNegation: true, segments: [literal("packages"), literal("internal")], ... }
 */
export function parsePattern(pattern: string): ParsedPattern {
    // Handle negation
    const isNegation = pattern.startsWith('!');
    const cleanPattern = isNegation ? pattern.slice(1) : pattern;

    // Split into segments
    const parts = cleanPattern.split('/').filter((p) => p !== '');
    const segments: PatternSegment[] = [];
    const staticParts: string[] = [];
    let foundWildcard = false;
    let hasGlobstar = false;

    for (const part of parts) {
        if (part === '**') {
            segments.push({ type: 'globstar' });
            foundWildcard = true;
            hasGlobstar = true;
        } else if (part === '*' || part.includes('*')) {
            // Treat any segment with * as a wildcard
            segments.push({ type: 'wildcard' });
            foundWildcard = true;
        } else {
            segments.push({ type: 'literal', value: part });
            if (!foundWildcard) {
                staticParts.push(part);
            }
        }
    }

    // Calculate max depth
    // - If has globstar (**), depth is unlimited (-1)
    // - Otherwise, count segments after static prefix
    let maxDepth: number;
    if (hasGlobstar) {
        maxDepth = -1; // unlimited
    } else {
        // Count non-static segments
        maxDepth = segments.length - staticParts.length;
    }

    return {
        raw: pattern,
        segments,
        isNegation,
        staticPrefix: staticParts.join('/'),
        maxDepth,
    };
}

/**
 * Check if a relative path matches a parsed pattern
 * Used for negation pattern filtering
 */
export function matchPattern(pattern: ParsedPattern, relativePath: string): boolean {
    const pathParts = relativePath.split('/').filter((p) => p !== '');
    const segments = pattern.segments;

    let pathIdx = 0;
    let segIdx = 0;

    while (segIdx < segments.length && pathIdx < pathParts.length) {
        const segment = segments[segIdx]!;

        switch (segment.type) {
            case 'literal':
                if (segment.value !== pathParts[pathIdx]) {
                    return false;
                }
                pathIdx++;
                segIdx++;
                break;

            case 'wildcard':
                // Single wildcard matches exactly one segment
                pathIdx++;
                segIdx++;
                break;

            case 'globstar': {
                // Globstar matches zero or more segments
                // If it's the last segment, match everything
                if (segIdx === segments.length - 1) {
                    return true;
                }

                // Try to match the rest of the pattern
                const nextSegment = segments[segIdx + 1];
                if (nextSegment && nextSegment.type === 'literal') {
                    // Find the next literal in the path
                    while (pathIdx < pathParts.length) {
                        if (pathParts[pathIdx] === nextSegment.value) {
                            break;
                        }
                        pathIdx++;
                    }
                }
                segIdx++;
                break;
            }
        }
    }

    // Pattern is fully matched if we've consumed all segments
    // (path may have more parts for patterns ending with * or **)
    return segIdx === segments.length;
}

/**
 * Parse multiple patterns and separate into positive and negative patterns
 */
export function parsePatterns(patterns: string[]): {
    positive: ParsedPattern[];
    negative: ParsedPattern[];
} {
    const positive: ParsedPattern[] = [];
    const negative: ParsedPattern[] = [];

    for (const pattern of patterns) {
        const parsed = parsePattern(pattern);
        if (parsed.isNegation) {
            negative.push(parsed);
        } else {
            positive.push(parsed);
        }
    }

    return { positive, negative };
}
