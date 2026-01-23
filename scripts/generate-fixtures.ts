#!/usr/bin/env tsx
/**
 * Script to generate test fixtures for performance testing
 * Generates monorepo fixtures of different sizes and types
 */

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'pathe';

type PM = 'pnpm' | 'yarn' | 'npm';
type Size = 'tiny' | 'small' | 'medium' | 'large' | 'massive';

const SIZES = {
    tiny: 10,
    small: 50,
    medium: 200,
    large: 500,
    massive: 2000,
} as const;

const BATCH_SIZE = 100; // 每批并行生成的包数量

interface FixtureConfig {
    pm: PM;
    size: Size;
    outputDir: string;
}

async function ensureDir(dir: string) {
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
}

async function generatePackageJson(
    name: string,
    isRoot = false,
    workspaces?: string[],
) {
    const pkg: Record<string, unknown> = {
        name,
        version: '1.0.0',
        description: `Test package ${name}`,
    };

    if (isRoot && workspaces) {
        pkg.workspaces = workspaces;
    }

    if (!isRoot) {
        pkg.main = 'index.js';
        pkg.scripts = {
            test: 'echo "Error: no test specified" && exit 1',
        };
        pkg.keywords = [];
        pkg.author = '';
        pkg.license = 'ISC';
    }

    return JSON.stringify(pkg, null, 2);
}

async function generatePnpmWorkspace(patterns: string[]) {
    return `packages:\n${patterns.map((p) => `  - '${p}'`).join('\n')}\n`;
}

async function generatePackageBatch(
    packages: Array<{ name: string; dir: string }>,
) {
    await Promise.all(
        packages.map(async ({ name, dir }) => {
            await ensureDir(dir);
            const pkg = await generatePackageJson(`@workspace/${name}`, false);
            await writeFile(path.join(dir, 'package.json'), pkg);
            await writeFile(
                path.join(dir, 'index.js'),
                `module.exports = { name: '${name}' };\n`,
            );
        }),
    );
}

async function generatePnpmFixture(config: FixtureConfig) {
    const { size, outputDir } = config;
    const numPackages = SIZES[size];
    const rootDir = path.join(outputDir, `pnpm-${size}`);

    await ensureDir(rootDir);
    await ensureDir(path.join(rootDir, 'packages'));

    // Generate root package.json
    const rootPkg = await generatePackageJson('pnpm-workspace-root', true);
    await writeFile(path.join(rootDir, 'package.json'), rootPkg);

    // Generate pnpm-workspace.yaml
    const workspace = await generatePnpmWorkspace(['packages/*']);
    await writeFile(path.join(rootDir, 'pnpm-workspace.yaml'), workspace);

    // Generate packages in batches for better performance
    const packages: Array<{ name: string; dir: string }> = [];
    for (let i = 0; i < numPackages; i++) {
        const pkgName = `pnpm-pkg-${i + 1}`;
        packages.push({
            name: pkgName,
            dir: path.join(rootDir, 'packages', pkgName),
        });
    }

    // Process in batches
    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
        const batch = packages.slice(i, i + BATCH_SIZE);
        await generatePackageBatch(batch);
    }

    // Create empty lock file
    await writeFile(
        path.join(rootDir, 'pnpm-lock.yaml'),
        "lockfileVersion: '6.0'\n",
    );

    console.log(
        `✓ Generated pnpm fixture (${size}) with ${numPackages} packages at ${rootDir}`,
    );
}

async function generateYarnFixture(config: FixtureConfig) {
    const { size, outputDir } = config;
    const numPackages = SIZES[size];
    const rootDir = path.join(outputDir, `yarn-${size}`);

    await ensureDir(rootDir);
    await ensureDir(path.join(rootDir, 'packages'));

    // Generate root package.json with workspaces
    const rootPkg = await generatePackageJson('yarn-workspace-root', true, [
        'packages/*',
    ]);
    await writeFile(path.join(rootDir, 'package.json'), rootPkg);

    // Generate packages in batches
    const packages: Array<{ name: string; dir: string }> = [];
    for (let i = 0; i < numPackages; i++) {
        const pkgName = `yarn-pkg-${i + 1}`;
        packages.push({
            name: pkgName,
            dir: path.join(rootDir, 'packages', pkgName),
        });
    }

    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
        const batch = packages.slice(i, i + BATCH_SIZE);
        await generatePackageBatch(batch);
    }

    // Create empty lock file
    await writeFile(path.join(rootDir, 'yarn.lock'), '# yarn lockfile v1\n');

    console.log(
        `✓ Generated yarn fixture (${size}) with ${numPackages} packages at ${rootDir}`,
    );
}

async function generateNpmFixture(config: FixtureConfig) {
    const { size, outputDir } = config;
    const numPackages = SIZES[size];
    const rootDir = path.join(outputDir, `npm-${size}`);

    await ensureDir(rootDir);
    await ensureDir(path.join(rootDir, 'packages'));

    // Generate root package.json with workspaces
    const rootPkg = await generatePackageJson('npm-workspace-root', true, [
        'packages/*',
    ]);
    await writeFile(path.join(rootDir, 'package.json'), rootPkg);

    // Generate packages in batches
    const packages: Array<{ name: string; dir: string }> = [];
    for (let i = 0; i < numPackages; i++) {
        const pkgName = `npm-pkg-${i + 1}`;
        packages.push({
            name: pkgName,
            dir: path.join(rootDir, 'packages', pkgName),
        });
    }

    for (let i = 0; i < packages.length; i += BATCH_SIZE) {
        const batch = packages.slice(i, i + BATCH_SIZE);
        await generatePackageBatch(batch);
    }

    // Create empty lock file
    await writeFile(
        path.join(rootDir, 'package-lock.json'),
        JSON.stringify({ lockfileVersion: 3 }, null, 2),
    );

    console.log(
        `✓ Generated npm fixture (${size}) with ${numPackages} packages at ${rootDir}`,
    );
}

async function generateFixtures() {
    const outputDir = path.join(
        process.cwd(),
        'test',
        'fixture',
        'performance',
    );
    await ensureDir(outputDir);

    const pms: PM[] = ['pnpm', 'yarn', 'npm'];
    const sizes: Size[] = ['tiny', 'small', 'medium', 'large', 'massive'];

    console.log('Generating performance test fixtures...\n');

    for (const pm of pms) {
        for (const size of sizes) {
            const config: FixtureConfig = { pm, size, outputDir };
            const startTime = Date.now();

            if (pm === 'pnpm') {
                await generatePnpmFixture(config);
            } else if (pm === 'yarn') {
                await generateYarnFixture(config);
            } else if (pm === 'npm') {
                await generateNpmFixture(config);
            }

            const elapsed = Date.now() - startTime;
            console.log(`  (generated in ${elapsed}ms)\n`);
        }
    }

    console.log('\n✅ All fixtures generated successfully!');
}

// Run the script
generateFixtures().catch((error) => {
    console.error('Error generating fixtures:', error);
    process.exit(1);
});
