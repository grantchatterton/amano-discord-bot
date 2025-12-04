import { DataTypes } from "sequelize";

/**
 * @type {import("./index.js").ModelLoader}
 */
export default (sequelize) => {
	return sequelize.define("User", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		userId: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		trackMessages: {
			type: DataTypes.BOOLEAN,
			defaultValue: true,
			allowNull: false,
		},
		birthday: {
			type: DataTypes.DATE,
			allowNull: true,
			defaultValue: null,
		},
	});
};
