import { DataTypes } from "sequelize";
import { MESSAGE_REPLY_CHANCE } from "../config.js";
import sequelize from "./db.js";

const Channel = sequelize.define("Channel", {
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
		validate: {
			min: 0,
			max: 100,
		},
		get() {
			const rawValue = this.getDataValue("replyChance");
			return rawValue ?? MESSAGE_REPLY_CHANCE;
		},
	},
});

export default Channel;
