import process from "node:process";
import Cryptr from "cryptr";
import { DataTypes } from "sequelize";

const cryptr = new Cryptr(process.env.WEBHOOK_ENCRYPTION_KEY);

/**
 * @type {import("./index.js").ModelLoader}
 */
export default (sequelize) => {
	return sequelize.define("Guild", {
		id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		guildId: {
			type: DataTypes.STRING,
			unique: true,
			allowNull: false,
		},
		birthdayWebhookUrl: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: null,
			get() {
				const value = this.getDataValue("birthdayWebhookUrl");
				return value ? cryptr.decrypt(value) : null;
			},
			set(value) {
				this.setDataValue("birthdayWebhookUrl", value ? cryptr.encrypt(value) : null);
			},
		},
	});
};
