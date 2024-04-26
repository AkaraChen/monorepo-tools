import { EPackageManager } from "./types";

export function getPackageManagerByUserAgent(): EPackageManager {
    const packageManager = process.env.npm_config_user_agent || "";
    for (const key in EPackageManager) {
        if (packageManager.startsWith(EPackageManager[key])) {
            return EPackageManager[key];
        }
    }
    throw new Error("Unknown package manager");
}
