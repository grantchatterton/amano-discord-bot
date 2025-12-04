import process from "node:process";
import Cryptr from "cryptr";
import { DataTypes } from "sequelize";

const cryptr = new Cryptr(process.env.WEBHOOK_ENCRYPTION_KEY);

function encryptURL(url) {
	return cryptr.encrypt(url);
}

function decryptURL(encryptedUrl) {
	return cryptr.decrypt(encryptedUrl);
}

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
			type: DataTypes.BLOB,
			allowNull: true,
			defaultValue: null,
			get() {
				const value = this.getDataValue("birthdayWebhookUrl");
				return value ? decryptURL(value) : null;
			},
			set(value) {
				this.setDataValue("birthdayWebhookUrl", value ? encryptURL(value) : null);
			},
		},
	});
};
