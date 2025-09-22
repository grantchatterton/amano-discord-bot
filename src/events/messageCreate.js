import { Events } from "discord.js";
import { getMessageReply } from "../util/util.js";

/** @type {import('./index.js').Event<Events.MessageCreate>} */
export default {
	name: Events.MessageCreate,
	async execute(message) {
		if (!message.author.bot) {
			try {
				const reply = await getMessageReply(message);
				if (reply) {
					await message.reply(reply);
				}
			} catch (error) {
				console.error(error);
			}
		}
	},
};
