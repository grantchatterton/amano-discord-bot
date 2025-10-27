import process from "node:process";
import { URL } from "node:url";
import { loadModels } from "../util/loaders.js";
import { sequelize } from "./db.js";

export async function initDB() {
	// Load models
	const modelLoaders = await loadModels(new URL("../models/", import.meta.url));
	for (const modelLoader of modelLoaders) {
		modelLoader(sequelize);
	}

	// Sync the DB
	await sequelize.sync({ force: process.env.NODE_ENV === "development" });
}

export default initDB;
