import { DataTypes } from "sequelize";
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
	},
});

export default Channel;
