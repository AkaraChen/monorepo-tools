export enum EPackageManager {
    NPM = "npm",
    YARN = "yarn",
    PNPM = "pnpm",
}

export interface PackageManager {
    name: EPackageManager;
    findPackages: (root: string) => Promise<string[]>;
}
