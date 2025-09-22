import fs from "node:fs/promises";
import { DataTypes } from "sequelize";
import { sequelize } from "../db/db.js";

export async function loadModels() {
	try {
		const files = await fs.readdir(import.meta.dirname);
		for (const file of files) {
			if (file !== "index.js" && file.endsWith(".js")) {
				const module = await import(`./${file}`);
				module.default(sequelize, DataTypes);
			}
		}
	} catch (error) {
		console.error(error);
	}
}

export default loadModels;
