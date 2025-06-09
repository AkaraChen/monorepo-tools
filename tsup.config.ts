import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['./src/index.ts'],
    dts: true,
    format: ['esm'],
    tsconfig: 'tsconfig.json',
    banner({ format }) {
        if (format === 'esm')
            return {
                js: `import { createRequire } from 'module';
                const require = createRequire(import.meta.url);`,
            };
    },
    platform: 'node',
});
