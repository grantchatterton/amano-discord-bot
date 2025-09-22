import { MESSAGE_REPLY_CHANCE } from "../config.js";

export default (sequelize, DataTypes) => {
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
