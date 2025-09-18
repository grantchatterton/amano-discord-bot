import { AttachmentBuilder, Events } from "discord.js";
import { getRandomQuote, getReplyImage, hasSwear, shouldReplyToMessage } from "../util/util.js";

export default {
	name: Events.MessageCreate,
	async execute(message) {
		if (!message.author.bot && hasSwear(message.content) && shouldReplyToMessage()) {
			try {
				const [quote, image] = await Promise.all([getRandomQuote(), getReplyImage()]);
				await message.reply({
					content: quote,
					files: [new AttachmentBuilder(image)],
				});
			} catch (error) {
				console.error(error);
			}
		}
	},
};
