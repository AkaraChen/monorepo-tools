export type PM = 'npm' | 'yarn' | 'pnpm' | 'bun' | 'deno';

export type PnpmWorkspaceYaml = {
    packages: string[];
};

export interface PackageJson {
    name?: string;
    version?: string;
    workspaces?: string[] | { packages?: string[] };
    [key: string]: unknown;
}

export interface Project {
    rootDir: string;
    rootDirRealPath?: string;
    manifest: PackageJson;
    writeProjectManifest?: () => void;
}
