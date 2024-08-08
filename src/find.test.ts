import { expect, test } from "vitest";
import { pnpmFixture, yarnFixture } from "../test";
import { findUpRoot, scanProjects } from "./find";
import { detectPM } from "./pm";

test("test find in pnpm root workspace", async () => {
	const projects = await scanProjects(pnpmFixture, await detectPM(pnpmFixture));
	expect(projects.length).toBe(3);

	const root = await findUpRoot(pnpmFixture, await detectPM(pnpmFixture));
	expect(root).toBe(pnpmFixture);
});

test("test find in pnpm sub workspace", async () => {
	const projects = await scanProjects(pnpmFixture, await detectPM(pnpmFixture));
	const pkg1 = projects.at(0);
	if (!pkg1) throw new Error("pkg1 not found");
	expect(await findUpRoot(pkg1.rootDir, await detectPM(pkg1.rootDir))).toBe(
		pnpmFixture,
	);
});

test("test find in yarn root workspace", async () => {
	const projects = await scanProjects(yarnFixture, await detectPM(yarnFixture));
	expect(projects.length).toBe(3);

	const root = await findUpRoot(yarnFixture, await detectPM(yarnFixture));
	expect(root).toBe(yarnFixture);
});

test("test find in yarn sub workspace", async () => {
	const projects = await scanProjects(yarnFixture, await detectPM(yarnFixture));
	const pkg1 = projects.at(0);
	if (!pkg1) throw new Error("pkg1 not found");
	expect(await findUpRoot(pkg1.rootDir, await detectPM(yarnFixture))).toBe(
		yarnFixture,
	);
});
