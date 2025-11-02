import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
//import dotenv from "dotenv";

// Get the project root directory (parent of src/)
//const __dirname = path.dirname(fileURLToPath(import.meta.url));
//const rootPath = path.resolve(__dirname, "..");

// Initialize environment variables
//dotenv.config({ path: path.join(rootPath, ".env") });

export const MESSAGE_REPLY_CHANCE = 25;
export const MESSAGE_REPLY_IMAGE = "https://static.wikia.nocookie.net/aceattorney/images/4/4e/Ernest_Placating_1.gif";

export const MAX_MESSAGE_LIMIT = (() => {
	const limit = Number.parseInt(process.env.MAX_MESSAGE_LIMIT, 10);
	return Number.isNaN(limit) ? 20 : limit;
})();
