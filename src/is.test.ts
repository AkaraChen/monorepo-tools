import path from "node:path";
import { expect, test } from "vitest";
import { pnpmFixture, yarnFixture } from "../test";
import { isMonorepoRoot, isWorkspaceInMonorepo } from "./is";

test("is monorepo root", async () => {
	expect(await isMonorepoRoot(pnpmFixture)).toBe(true);
	expect(await isMonorepoRoot(yarnFixture)).toBe(true);
	expect(await isMonorepoRoot(__dirname)).toBe(false);
});

test("is workspace in monorepo", async () => {
	expect(
		await isWorkspaceInMonorepo(
			pnpmFixture,
			path.join(pnpmFixture, "packages", "pkg1"),
		),
	).toBe(true);
	expect(await isWorkspaceInMonorepo(pnpmFixture, yarnFixture)).toBe(false);

	expect(
		await isWorkspaceInMonorepo(
			yarnFixture,
			path.join(yarnFixture, "packages", "pkg1"),
		),
	).toBe(true);
	expect(await isWorkspaceInMonorepo(yarnFixture, pnpmFixture)).toBe(false);
});
