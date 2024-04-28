import { existsSync } from "node:fs";
import { join } from "node:path";
import { PackageManagerName } from "./types";

/**
 * Retrieves the package manager name based on the user agent.
 * @returns The package manager name.
 * @throws Throws an error if the package manager is unknown.
 */
export function getPackageManagerByUserAgent(): PackageManagerName {
	const packageManager = process.env.npm_config_user_agent || "";
	for (const key in PackageManagerName) {
		// @ts-expect-error
		if (packageManager.startsWith(PackageManagerName[key])) {
			// @ts-expect-error
			return PackageManagerName[key];
		}
	}
	throw new Error("Unknown package manager");
}

/**
 * Determines the package manager used in a given directory based on the presence of lock files.
 * @param searchDir - The directory to search for lock files.
 * @returns A Promise that resolves to the name of the package manager.
 * @throws An error if the package manager cannot be determined.
 */
export async function getPackageManagerByLockfile(
	searchDir: string,
): Promise<PackageManagerName> {
	const dir = searchDir;
	if (existsSync(join(dir, "yarn.lock"))) {
		return PackageManagerName.YARN;
	}
	if (existsSync(join(dir, "pnpm-lock.yaml"))) {
		return PackageManagerName.PNPM;
	}
	if (existsSync(join(dir, "package-lock.json"))) {
		return PackageManagerName.NPM;
	}
	throw new Error("Unknown package manager");
}

/**
 * Retrieves the package manager name based on the provided search directory.
 * If the package manager cannot be determined by the lockfile, it falls back to the user agent.
 *
 * @param searchDir - The directory to search for the lockfile.
 * @returns A Promise that resolves to the package manager name.
 */
export async function getPackageManager(
	searchDir: string,
): Promise<PackageManagerName> {
	try {
		return await getPackageManagerByLockfile(searchDir);
	} catch {
		return getPackageManagerByUserAgent();
	}
}
