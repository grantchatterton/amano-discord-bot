import { DataTypes } from "sequelize";
import { MESSAGE_REPLY_CHANCE } from "../config.js";

/**
 * @type {import("./index.js").ModelLoader}
 */
export default (sequelize) => {
	return sequelize.define("Channel", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		channelId: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		replyChance: {
			type: DataTypes.INTEGER,
			defaultValue: MESSAGE_REPLY_CHANCE,
			allowNull: false,
			validate: {
				min: 0,
				max: 100,
			},
		},
	});
};
