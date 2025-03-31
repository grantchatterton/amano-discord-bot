import { AttachmentBuilder, Events, MessageType } from 'discord.js';
import { MESSAGE_SWEAR_REPLY_IMAGE } from '../config.js';
import { getReply } from '../util/replies.js';
import { getRandomQuote, hasSwear, shouldReplyToMessage } from '../util/util.js';

const GRANT_USER_ID = '981636334768783370';

export default {
	name: Events.MessageCreate,
	async execute(message) {
		// console.log(message);

		// Check if this message is signalling a poll result
		if (message.type === MessageType.PollResult) {
			// Fetch channel and message ID
			const { channel } = message;
			const { messageId: pollMessageId } = message.reference;
			// console.log(pollMessageId);

			// Fetch poll message/object data
			const pollMessage = await channel.messages.fetch(pollMessageId);
			const { poll } = pollMessage;

			// Keep going only if results are available,
			// and this wasn't a multi-answer poll
			if (!poll.resultsFinalized || poll.allowMultiselect) {
				return;
			}

			// Fetch the answers associated with the poll
			// Each answer contains the props specified in the "PollAnswer" class,
			// alongside a set containing voter IDs of said answer
			const answers = await Promise.all(
				poll.answers.map(async (answer) => {
					const voters = await answer.fetchVoters().then((result) => new Set(result.map((voter) => voter.id)));
					return {
						...answer,
						voters,
					};
				}),
			);
			// console.log(answers);

			// Find the answer that Grant may have chosen
			const grantAnswer = answers.find((answer) => answer.voters.has(GRANT_USER_ID));
			if (!grantAnswer) {
				return;
			}

			// Fetch the winning answer
			const winningAnswer = answers.reduce((prevVal, currVal) => {
				return prevVal.voteCount > currVal.voteCount ? prevVal : currVal;
			});

			// Check if the answer Grant chose and the winning answer are the same
			if (grantAnswer.id === winningAnswer.id) {
				return;
			}

			// Reply to the poll stating it is fake!
			await pollMessage.reply('Fake Poll');
			return;
		}

		// Make sure a bot didn't send the message (including this one)
		if (!message.author.bot) {
			// Check if the message content/text is mapped to a certain reply
			const reply = getReply(message.content.toLowerCase());
			if (reply) {
				// Reply to the message!
				await message.reply(reply);
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
