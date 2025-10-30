# Performance Testing and Optimization

This document describes the performance testing infrastructure and optimizations made to the monorepo-tools library.

## Overview

Performance testing was implemented to measure and optimize the library's behavior across different monorepo types (pnpm, yarn, npm) and sizes (small: 5 packages, medium: 20 packages, large: 100 packages).

## Fixture Generation

A script was created to generate test fixtures for performance testing:

```bash
pnpm generate-fixtures
```

This generates 9 test fixtures covering all combinations of:
- **Package managers**: pnpm, yarn, npm
- **Sizes**: 
  - Small: 5 packages
  - Medium: 20 packages
  - Large: 100 packages

## Running Benchmarks

To run performance benchmarks:

```bash
pnpm bench
```

This will benchmark all major functions across all fixture types and sizes.

## Optimizations Implemented

### 1. isInMonorepo Optimization

**Problem**: The original implementation called `findPackages(root)` which scanned all packages in the monorepo, then used glob to find matching directories.

**Solution**: Removed the `findPackages` call and directly used glob results to check if the workspace directory matches the patterns.

**Performance Improvement**:
- Small repos: 3.45x faster (1.73ms → 0.50ms)
- Medium repos: 4.14x faster (3.27ms → 0.79ms)
- Large repos: 4.49x faster (10.60ms → 2.37ms)

### 2. Config Caching

**Problem**: `readConfig()` was called multiple times for the same root directory, causing redundant I/O operations.

**Solution**: Added a simple in-memory cache (Map) to store config results by normalized root path.

**Additional Performance Improvement**:
- Small repos: 1.72x faster (0.50ms → 0.29ms)
- Medium repos: 1.35x faster (0.79ms → 0.59ms)
- Large repos: 1.08x faster (2.37ms → 2.19ms)

### Combined Impact

**Total isInMonorepo improvement** from baseline:
- Small repos: **5.95x faster** (1.73ms → 0.29ms)
- Medium repos: **5.58x faster** (3.27ms → 0.59ms)
- Large repos: **4.85x faster** (10.60ms → 2.19ms)

## Benchmark Results Summary

### Before Optimizations

| Function | Package Manager | Size | Time (ms) |
|----------|----------------|------|-----------|
| isInMonorepo | pnpm | small | 1.73 |
| isInMonorepo | pnpm | medium | 3.27 |
| isInMonorepo | pnpm | large | 10.60 |
| scanProjects | pnpm | small | 5.36 |
| scanProjects | pnpm | medium | 6.55 |
| scanProjects | pnpm | large | 20.19 |

### After Optimizations

| Function | Package Manager | Size | Time (ms) | Improvement |
|----------|----------------|------|-----------|-------------|
| isInMonorepo | pnpm | small | 0.29 | 5.95x |
| isInMonorepo | pnpm | medium | 0.59 | 5.58x |
| isInMonorepo | pnpm | large | 2.19 | 4.85x |
| scanProjects | pnpm | small | 2.05 | 2.61x |
| scanProjects | pnpm | medium | 2.56 | 2.56x |
| scanProjects | pnpm | large | 7.62 | 2.65x |

## Performance Characteristics

### scanProjects
- Scales linearly with the number of packages
- ~2ms overhead for small repos, ~8ms for large repos (100 packages)
- Significantly improved by isInMonorepo optimization

### findUpRoot
- Very fast for all sizes (~0.1ms for pnpm, ~0.25ms for yarn/npm)
- Size-independent performance for root directory lookups
- Slightly slower when searching from subdirectories

### isInMonorepo
- Now optimized to avoid full package scans
- Scales well with monorepo size
- Benefits significantly from config caching

### detectPM
- Extremely fast (~0.006ms)
- Size-independent (only checks lock files)
- No optimization needed

## Recommendations for Users

1. **Reuse contexts**: If calling multiple functions on the same monorepo, they will benefit from the config cache
2. **Use specific package manager**: When known, specify the package manager to avoid fallback checks
3. **Large monorepos**: The optimizations make the library efficient even for very large monorepos (100+ packages)

## Future Optimization Opportunities

1. **Parallel package scanning**: For very large monorepos, could parallelize package discovery
2. **Incremental updates**: Cache could be invalidated selectively when files change
3. **Lazy evaluation**: Some operations could be deferred until needed
4. **Worker threads**: For extremely large repos, could use worker threads for I/O operations
