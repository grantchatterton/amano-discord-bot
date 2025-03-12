import { AttachmentBuilder, Events } from 'discord.js';
import { MESSAGE_IMAGE } from '../util/message/config.js';
import { hasSwear, shouldSendMessage, shouldSendFunnyImage, getRandomQuote } from '../util/message/util.js';

const ATTACHMENT_MESSAGE_IMAGE = new AttachmentBuilder(MESSAGE_IMAGE);
const MESSAGE_FUNNY_IMAGE =
	'https://cdn.discordapp.com/attachments/1304273752414097499/1349044313769775168/20240505_045206.jpg?ex=67d2fc6c&is=67d1aaec&hm=d0dabc5d37b615bddceeac5c95125ec89ae07d21a6a5c1d90e08dad7074faf2c&';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// console.log('called');

		// make sure a bot (including this one) did not send the message
		if (!message.author.bot) {
			// check if we should reply with the funny image
			if (shouldSendFunnyImage()) {
				await message.reply(MESSAGE_FUNNY_IMAGE);
			}
			// check if the message contained a swear and whether we should reply
			else if (
				hasSwear(message.content) && // ensure the message contains a swear
				shouldSendMessage() // determine if we should send a reply (based on "MESSAGE_CHANCE" config variable)
			) {
				await message.reply({
					content: getRandomQuote(),
					files: [ATTACHMENT_MESSAGE_IMAGE],
				});
			}
		}
	},
};
