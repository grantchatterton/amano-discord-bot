import path from "node:path";
import process from "node:process";
import appRootPath from "app-root-path";
import dotenv from "dotenv";

// Initialize environment variables
// Load .env first (base configuration)
dotenv.config({ path: path.join(appRootPath.path, ".env") });
// Then load .env.local (local overrides, not committed to repo)
// Use override: true to allow .env.local to override values from .env
dotenv.config({ path: path.join(appRootPath.path, ".env.local"), override: true });

export const MESSAGE_REPLY_CHANCE = 25;
export const MESSAGE_REPLY_IMAGE = "https://static.wikia.nocookie.net/aceattorney/images/4/4e/Ernest_Placating_1.gif";

export const MAX_MESSAGE_LIMIT = (() => {
	const limit = Number.parseInt(process.env.MAX_MESSAGE_LIMIT, 10);
	return Number.isNaN(limit) ? 20 : limit;
})();
