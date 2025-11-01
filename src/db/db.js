import process from "node:process";
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
	dialect: process.env.DB_DIALECT || "sqlite",
	host: process.env.DB_HOST || "localhost",
	port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
	database: process.env.DB_NAME || "amano",
	username: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	storage: process.env.DB_STORAGE || ":memory:",
});

await sequelize.authenticate();

export default sequelize;
