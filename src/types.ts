export type PM = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno';

export type PnpmWorkspaceYaml = {
    packages: string[];
};
