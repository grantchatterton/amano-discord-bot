import process from "node:process";
import { loadModels } from "../models/index.js";
import { sequelize } from "./db.js";

export async function initDB() {
	// Load the DB models
	await loadModels();

	// Sync the DB models
	await sequelize.sync({ force: process.env.NODE_ENV === "development", alter: true });
}

export default initDB;
