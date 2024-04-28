import fs from "node:fs/promises";
import path from "node:path";
import { findPackages } from "@pnpm/fs.find-packages";
import { findUp } from "find-up";
import { readPackageUp } from "read-package-up";
import yaml from "yaml";
import { isWorkspaceInMonorepo } from "./is";
import { PackageManagerName } from "./types";
import {
	findAndParseJson,
	getWorkspaceMonorepoConfig,
	safeResolve,
} from "./utils";

/**
 * Finds the root directory of a monorepo or workspace based on the provided search directory and package manager.
 * @param searchDir The directory to start searching from.
 * @param packageManager The package manager used in the monorepo or workspace.
 * @returns The root directory of the monorepo or workspace.
 * @throws {Error} If no workspace root is found or if the directory is not in the workspace.
 */
export async function findUpRoot(
	searchDir: string,
	packageManager: PackageManagerName,
) {
	// pnpm workspaces
	if (packageManager === PackageManagerName.PNPM) {
		const dir = await findUp("pnpm-workspace.yaml", {
			cwd: searchDir,
		}).then((dir) => {
			if (!dir) throw new Error("No workspace root found");
			return path.dirname(dir);
		});
		if (dir) {
			const config = yaml.parse(
				await fs.readFile(path.join(dir, "pnpm-workspace.yaml"), "utf-8"),
			);
			if (!config.packages) throw new Error("No workspace config found");
			if (await isWorkspaceInMonorepo(dir, searchDir)) return dir;
		}
		throw new Error("No workspace root found");
	}

	// yarn/npm workspaces
	let cwd = searchDir;
	while (true) {
		const pkg = await readPackageUp({ cwd: cwd });
		if (!pkg) throw new Error("No package.json root found");
		cwd = path.dirname(pkg.path);
		if (pkg.packageJson.workspaces) {
			if (await isWorkspaceInMonorepo(cwd, searchDir)) return cwd;
			throw new Error("This directory is not in the workspace");
		}
		cwd = safeResolve(cwd, "..");
	}
}

/**
 * Finds the path to the root package.json file by searching upwards from the specified directory.
 *
 * @param searchDir - The directory to start the search from.
 * @param packageManager - The package manager to use for the search (e.g., "npm", "yarn").
 * @returns The path to the root package.json file.
 */
export async function findUpRootPackageJson(
	searchDir: string,
	packageManager: PackageManagerName,
) {
	const root = await findUpRoot(searchDir, packageManager);
	return path.join(root, "package.json");
}

/**
 * Finds all projects within a monorepo.
 *
 * @param searchDir - The directory to start searching from. Defaults to the current working directory.
 * @param packageManager - The package manager to use. If not provided, it will be determined automatically.
 * @returns A promise that resolves to an array of project objects.
 * @throws An error if no workspace root is found.
 */
export async function findProjects(
	searchDir: string,
	packageManager: PackageManagerName,
) {
	const rootPackageJson = await findUpRootPackageJson(
		searchDir,
		packageManager,
	);
	if (packageManager === PackageManagerName.PNPM) {
		const rootPath = path.dirname(rootPackageJson);
		return await findPackages(rootPath);
	}
	const { globs } = await getWorkspaceMonorepoConfig(
		path.dirname(rootPackageJson),
	);
	if (!globs) {
		throw new Error("No workspace root found");
	}
	const results = await Promise.all(
		globs.map((d) => {
			const dir = path
				.join(path.dirname(rootPackageJson), d)
				.replaceAll("*", "");
			return findPackages(dir);
		}),
	);
	// yarn/npm workspaces seems can't find the root package, so add it manually
	results.push([
		{
			dir: path.dirname(rootPackageJson),
			// @ts-expect-error
			manifest: {
				...findAndParseJson(rootPackageJson),
			},
			writeProjectManifest: () => {
				throw new Error("Not implemented");
			},
		},
	]);
	return results.flat();
}
