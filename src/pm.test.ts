import { expect, test } from "vitest";
import { pnpmFixture } from "../test";
import { detectPMByLock, detectPMByUA } from "./pm";

test("get by lockfile", async () => {
	const pm = await detectPMByLock(pnpmFixture);
	expect(pm).toBe("pnpm");
});

test("get by user agent", () => {
	process.env.npm_config_user_agent = "pnpm/2.0.0";
	const pm = detectPMByUA();
	expect(pm).toBe("pnpm");
});
