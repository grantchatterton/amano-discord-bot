import process from "node:process";
import { Sequelize } from "sequelize";

function createSequelize() {
	if (process.env.NODE_ENV !== "production") {
		return new Sequelize("sqlite::memory:");
	}

	const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT } = process.env;
	return new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
		host: DB_HOST,
		dialect: DB_DIALECT,
	});
}

const sequelize = createSequelize();

async function shutdown() {
	try {
		await sequelize.close();
		console.log("Sequelize connection closed");
	} catch (error) {
		console.error(error);
	}
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default sequelize;
