import { AttachmentBuilder, Events } from 'discord.js';
import * as config from './config.js';
import * as util from './util.js';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		if (
			!message.author.bot && // make sure a bot didn't send the message (including the one here)
			util.hasSwear(message.content) && // ensure the message contains a swear
			util.shouldSendMessage() // determine if we should send a reply (based on "MESSAGE_CHANCE" config variable)
		) {
			await message.channel.sendTyping();

			setTimeout(async () => {
				try {
					await message.reply({
						content: util.getRandomQuote(),
						files: [new AttachmentBuilder(config.MESSAGE_IMAGE)],
					});
					console.log(`Replied to message ${message.content}`);
				} catch (error) {
					console.error(error);
				}
			}, config.MESSAGE_DELAY * 1_000);
		}
	},
};
