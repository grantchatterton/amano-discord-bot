import { Events } from "discord.js";
import sequelize from "../models/db.js";

/** @type {import('./index.js').Event<Events.ClientReady>} */
export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// TODO: Modify to make safer for production
		await sequelize.sync({ alter: true });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
