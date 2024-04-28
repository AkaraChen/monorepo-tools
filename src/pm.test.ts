import { expect, test } from "vitest";
import { pnpmFixture } from "../test";
import {
	getPackageManagerByLockfile,
	getPackageManagerByUserAgent,
} from "./pm";
import { PackageManagerName } from "./types";

test("get by lockfile", async () => {
	const pm = await getPackageManagerByLockfile(pnpmFixture);
	expect(pm).toBe(PackageManagerName.PNPM);
});

test("get by user agent", () => {
	process.env.npm_config_user_agent = "pnpm/2.0.0";
	const pm = getPackageManagerByUserAgent();
	expect(pm).toBe(PackageManagerName.PNPM);
});
