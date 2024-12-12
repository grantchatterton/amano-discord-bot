import { AttachmentBuilder, Events } from 'discord.js';
import { MESSAGE_IMAGE, MESSAGE_DELAY } from '../util/message/config.js';
import { hasSwear, shouldSendMessage, getRandomQuote } from '../util/message/util.js';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// console.log('called');
		if (
			!message.author.bot && // make sure a bot didn't send the message (including the one here)
			hasSwear(message.content) && // ensure the message contains a swear
			shouldSendMessage() // determine if we should send a reply (based on "MESSAGE_CHANCE" config variable)
		) {
			await message.channel.sendTyping();

			setTimeout(async () => {
				try {
					await message.reply({
						content: getRandomQuote(),
						files: [new AttachmentBuilder(MESSAGE_IMAGE)],
					});
					console.log(`Replied to message ${message.content}`);
				} catch (error) {
					console.error(error);
				}
			}, MESSAGE_DELAY * 1_000);
		}
	},
};
