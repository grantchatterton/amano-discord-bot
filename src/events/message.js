import { AttachmentBuilder, Events } from 'discord.js';
import { MESSAGE_SWEAR_REPLY_IMAGE } from '../config.js';
import { getRandomQuote, hasSwear, shouldReplyToMessage } from '../util/util.js';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// Make sure a bot didn't send the message (including this one)
		if (!message.author.bot) {
			// Check if the message consists of just "i"
			if (message.content === 'i') {
				// Reply to the message!
				await message.reply('e');
			}
			// Check if the message contains a swear and whether we should reply to it
			else if (hasSwear(message.content) && shouldReplyToMessage()) {
				// Reply to the message!
				await message.reply({
					content: getRandomQuote(),
					files: [new AttachmentBuilder(MESSAGE_SWEAR_REPLY_IMAGE)],
				});
			}
		}
	},
};
