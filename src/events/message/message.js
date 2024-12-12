import { Events } from 'discord.js';

const MESSAGE_CHANCE = 25; // Chance (percentage) of replying to a message
const MESSAGE_DELAY = 1; // Delay (in seconds) before replying
const MESSAGE_IMAGE = 'https://static.wikia.nocookie.net/aceattorney/images/4/4e/Ernest_Placating_1.gif'; // Image to send with the message

export default {
	name: Events.MessageCreate,
	async execute(message) {},
};
