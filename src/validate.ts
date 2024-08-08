import type { PackageJson } from "read-package-up";

/**
 * Validates the package.json object.
 *
 * @param pkg - The package.json object to validate.
 * @returns The validated package.json object.
 * @throws Error if the package.json object is empty.
 */
export function parsePackage(pkg: unknown): PackageJson {
	// TODO: validate package.json
	if (!pkg) throw new Error("package.json is empty");
	return pkg as PackageJson;
}
