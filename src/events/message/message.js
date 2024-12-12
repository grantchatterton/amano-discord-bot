import { AttachmentBuilder, Events } from 'discord.js';
import * as config from './config.js';
import { getRandomQuote } from './util.js';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		await message.channel.sendTyping();

		setTimeout(async () => {
			try {
				await message.reply({
					content: getRandomQuote(),
					files: [new AttachmentBuilder(config.MESSAGE_IMAGE)],
				});
				console.log(`Replied to message ${message.content}`);
			} catch (error) {
				console.error(error);
			}
		}, config.MESSAGE_DELAY * 1_000);
	},
};
