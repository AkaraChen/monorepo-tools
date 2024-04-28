import { platform } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { pnpmFixture, yarnFixture } from "../test";
import { getWorkspaceMonorepoConfig, safeResolve } from "./utils";

test("safe resolve", () => {
	expect(() => {
		safeResolve(platform() === "win32" ? "C:\\" : "/");
	}).toThrowError();
});

test("get monorepo config", async () => {
	const pnpmConfig = await getWorkspaceMonorepoConfig(pnpmFixture);
	expect(pnpmConfig.type).toBe("pnpm");

	const yarnConfig = await getWorkspaceMonorepoConfig(yarnFixture);
	expect(yarnConfig.type).toBe("yarn");

	expect(() => getWorkspaceMonorepoConfig(__dirname)).rejects.toThrowError();
});
