import process from "node:process";
import { Sequelize } from "sequelize";

export default (() => {
	if (process.env.NODE_ENV === "development") {
		return new Sequelize("sqlite::memory:");
	}

	const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_DIALECT } = process.env;
	return new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
		host: DB_HOST,
		dialect: DB_DIALECT,
	});
})();
