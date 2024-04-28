import path from "node:path";
import { expect, test } from "vitest";
import { pnpmFixture, yarnFixture } from "../test";
import { findProjects, findUpRoot, findUpRootPackageJson } from "./find";
import { getPackageManager } from "./pm";

test("test find in pnpm root workspace", async () => {
	const projects = await findProjects(
		pnpmFixture,
		await getPackageManager(pnpmFixture),
	);
	expect(projects.length).toBe(3);

	const root = await findUpRoot(
		pnpmFixture,
		await getPackageManager(pnpmFixture),
	);
	expect(root).toBe(pnpmFixture);

	const packageJson = await findUpRootPackageJson(
		pnpmFixture,
		await getPackageManager(pnpmFixture),
	);
	expect(packageJson).toBe(path.join(pnpmFixture, "package.json"));
});

test("test find in pnpm sub workspace", async () => {
	const projects = await findProjects(
		pnpmFixture,
		await getPackageManager(pnpmFixture),
	);
	const pkg1 = projects.at(0);
	if (!pkg1) throw new Error("pkg1 not found");
	expect(await findUpRoot(pkg1.dir, await getPackageManager(pkg1.dir))).toBe(
		pnpmFixture,
	);
});

test("test find in yarn root workspace", async () => {
	const projects = await findProjects(
		yarnFixture,
		await getPackageManager(yarnFixture),
	);
	expect(projects.length).toBe(3);

	const root = await findUpRoot(
		yarnFixture,
		await getPackageManager(yarnFixture),
	);
	expect(root).toBe(yarnFixture);

	const packageJson = await findUpRootPackageJson(
		yarnFixture,
		await getPackageManager(yarnFixture),
	);
	expect(packageJson).toBe(path.join(yarnFixture, "package.json"));
});

test("test find in yarn sub workspace", async () => {
	const projects = await findProjects(
		yarnFixture,
		await getPackageManager(yarnFixture),
	);
	const pkg1 = projects.at(0);
	if (!pkg1) throw new Error("pkg1 not found");
	expect(await findUpRoot(pkg1.dir, await getPackageManager(yarnFixture))).toBe(
		yarnFixture,
	);
});
