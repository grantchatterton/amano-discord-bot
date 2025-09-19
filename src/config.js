import path from "node:path";
import process from "node:process";
import appRootPath from "app-root-path";
import dotenv from "dotenv";

// Initialize environment variables
dotenv.config({ path: path.join(appRootPath.path, `.env.${process.env.NODE_ENV || "development"}`) });

export const MESSAGE_REPLY_CHANCE = 25;
export const MESSAGE_REPLY_IMAGE = "https://static.wikia.nocookie.net/aceattorney/images/4/4e/Ernest_Placating_1.gif";

export default {
	MESSAGE_REPLY_CHANCE,
	MESSAGE_REPLY_IMAGE,
};
