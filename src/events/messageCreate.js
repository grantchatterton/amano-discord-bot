import { Events } from "discord.js";
import { getMessageReply } from "../util/util.js";

export default {
	name: Events.MessageCreate,
	async execute(message) {
		try {
			const reply = await getMessageReply(message);
			if (reply) {
				await message.reply(reply);
			}
		} catch (error) {
			console.error(error);
		}
	},
};
