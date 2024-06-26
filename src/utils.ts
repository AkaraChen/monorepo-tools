import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { PackageJson } from "read-package-up";
import yaml from "yaml";
import { validatePackageJson } from "./validate";

export async function findAndParseJson<T>(name: string): Promise<T | null> {
	if (existsSync(name) === false) {
		return null;
	}
	const content = await readFile(name, "utf-8");
	const json = JSON.parse(content);
	return json as T;
}

export function safeResolve(lastResult: string, ...args: string[]) {
	const result = path.resolve(lastResult, ...args);
	if (lastResult === result) {
		throw new Error("Encountered an infinite loop while resolving path");
	}
	return result;
}

export function getWorkspaceGlobsByPackageJson(
	packageJson: PackageJson,
): string[] {
	if (packageJson.workspaces) {
		const workspaces = packageJson.workspaces;
		const workspaceDirs = Array.isArray(workspaces)
			? workspaces
			: workspaces.packages;
		if (!workspaceDirs) {
			throw new Error("No workspace config found");
		}
		return workspaceDirs;
	}
	throw new Error("No workspace config found");
}

/**
 * Retrieves the monorepo configuration for a given workspace root.
 * @param root The root directory of the workspace.
 * @returns The monorepo configuration object.
 * @throws Error if no monorepo configuration is found.
 */
export async function getWorkspaceMonorepoConfig(root: string) {
	const pnpmWorkspace = path.join(root, "pnpm-workspace.yaml");
	if (existsSync(pnpmWorkspace)) {
		return {
			type: "pnpm",
			globs: yaml.parse(await readFile(pnpmWorkspace, "utf-8"))
				.packages as string[],
		};
	}
	const yarnWorkspace = path.join(root, "package.json");
	if (existsSync(yarnWorkspace)) {
		const globs = getWorkspaceGlobsByPackageJson(
			validatePackageJson(await findAndParseJson<PackageJson>(yarnWorkspace)),
		);
		return {
			type: "yarn",
			globs,
		};
	}
	throw new Error("No monorepo configuration found");
}
