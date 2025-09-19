import { Events } from "discord.js";
import Channel from "../models/channel.js";

/** @type {import('./index.js').Event<Events.ClientReady>} */
export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		// TODO: Modify to make safer for production
		await Channel.sync({ alter: true });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};
