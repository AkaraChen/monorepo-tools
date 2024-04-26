import { findWorkspaceDir } from "@pnpm/find-workspace-dir";
import { findPackages } from "@pnpm/fs.find-packages";
import fs from "node:fs/promises";
import path from "node:path";
import { readPackageUp } from "read-package-up";
import { getPackageManagerByUserAgent } from "./pm";
import { EPackageManager } from "./types";
import { validatePackageJson } from "./validate";

export const findWorkspacePackageJsonPath = async (
    searchDir: string,
    packageManager?: EPackageManager
) => {
    const manager = packageManager || getPackageManagerByUserAgent();
    if (manager === EPackageManager.PNPM) {
        const dir = await findWorkspaceDir(searchDir);
        if (dir) {
            return path.join(dir, "package.json");
        } else {
            throw new Error("No workspace root found");
        }
    }
    let cwd = searchDir;
    // yarn/npm workspaces
    // find up the directory tree for package.json with workspaces
    while (true) {
        const pkg = await readPackageUp({ cwd: cwd });
        if (pkg?.packageJson.workspaces) {
            const workspaces = pkg.packageJson.workspaces;
            const workspaceDirs = Array.isArray(workspaces)
                ? workspaces
                : workspaces.packages;
            if (!workspaceDirs) {
                throw new Error("No workspace root found");
            }
            const packages = await findPackages(cwd);
            // validate this dir is in the workspace
            for (const workspaceDir of workspaceDirs) {
                if (packages.map((p) => p.dir).includes(workspaceDir)) {
                    return path.join(cwd, "package.json");
                }
            }
            throw new Error("This directory is not in the workspace");
        }
        // when in windows, `path.resolve("C:\\")` will return `C:\\, so test whether cwd is like "C:\\"
        if (/^[A-Za-z]:\\$/.test(cwd)) {
            throw new Error("No workspace root found");
        }
        cwd = path.resolve(cwd, "..");
    }
};

export const findWorkspaceProjects = async (
    searchDir: string,
    packageManager: EPackageManager
) => {
    const rootPackageJson = await findWorkspacePackageJsonPath(
        searchDir,
        packageManager
    );
    if (packageManager === EPackageManager.PNPM) {
        const rootPath = path.dirname(rootPackageJson);
        return await findPackages(rootPath);
    }
    const workspaces = await fs.readFile(rootPackageJson, "utf-8");
    const json = JSON.parse(workspaces);
    const pkg = validatePackageJson(json);
    const workspaceDirs = Array.isArray(pkg.workspaces)
        ? pkg.workspaces
        : pkg?.workspaces?.packages;
    if (!workspaceDirs) {
        throw new Error("No workspace root found");
    }
    const promises = workspaceDirs.map((d) => findPackages(d));
    const results = await Promise.all(promises);
    return results.flat();
};
