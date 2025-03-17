import { AttachmentBuilder, Events } from 'discord.js';
import { MESSAGE_SWEAR_REPLY_IMAGE } from '../config.js';
import { getRandomQuote, hasSwear, shouldReplyToMessage } from '../util/util.js';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		if (
			!message.author.bot && // Make sure a bot didn't send the message (including this one)
			hasSwear(message.content) && // Make sure the message contains a swear
			shouldReplyToMessage() // Make sure we should actually reply to the message (based on the chance of it happening)
		) {
			// Reply to the message!
			await message.reply({
				content: getRandomQuote(),
				files: [new AttachmentBuilder(MESSAGE_SWEAR_REPLY_IMAGE)],
			});
		}
	},
};
