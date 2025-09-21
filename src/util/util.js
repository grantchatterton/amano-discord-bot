import process from "node:process";
import { AttachmentBuilder } from "discord.js";
import OpenAI from "openai";
import AmanoImages from "../images.js";
import { AMANO_QUOTES } from "../quotes.js";
import { channelService } from "../services/channelService.js";
import { SWEAR_PATTERNS } from "../swears.js";

/**
 * Returns a random integer in the range [min, max].
 *
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} Random integer.
 */
export function getRandomInt(min, max) {
	const minCeil = Math.ceil(min);
	const maxFloor = Math.floor(max);
	return Math.floor(Math.random() * (maxFloor - minCeil + 1) + minCeil);
}

/**
 * Given a message, returns whether it possesses a swear word.
 *
 * @param {string} message 	Message to check.
 * @returns {boolean} True if a swear exists, false otherwise.
 */
export function hasSwear(message) {
	// Split the text into an array of words
	const words = message
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter((word) => {
			return word.length > 0;
		});

	for (const word of words) {
		for (const pattern of SWEAR_PATTERNS) {
			if (pattern.test(word)) {
				// console.log(`Swear found: ${word}`);
				return true;
			}
		}
	}

	return false;
}

/**
 * Returns a random array element.
 *
 * @returns {any} Random element.
 */
export function getRandomElement(array) {
	return array[getRandomInt(0, array.length - 1)];
}

/**
 * Returns a Promise containing a reply quote.
 *
 * @returns {Promise<string>} Random quote.
 */
export async function getReplyQuote() {
	return getRandomElement(AMANO_QUOTES);
}

/**
 * Returns a Promise containing an image URL for replying to a message.
 *
 * @returns {Promise<string>} Image URL.
 */
export async function getReplyImage() {
	return getRandomElement(AmanoImages.AMANO_PLACATING);
}

/**
 * Returns a Promise containing an AI generated reply.
 *
 * @returns {Promise<string>} Reply content.
 */
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export async function getAIReply(message) {
	// Determine a random mood
	const moods = ["normal", "placating", "sad", "angry", "sweating"];
	const randomMood = getRandomElement(moods);
	let image;
	switch (randomMood) {
		case "normal":
			image = getRandomElement(AmanoImages.AMANO_NORMAL);
			break;
		case "placating":
			image = getRandomElement(AmanoImages.AMANO_PLACATING);
			break;
		case "sad":
			image = getRandomElement(AmanoImages.AMANO_SAD);
			break;
		case "angry":
			image = getRandomElement(AmanoImages.AMANO_ANGRY);
			break;
		case "sweating":
			image = getRandomElement(AmanoImages.AMANO_SWEATING);
			break;
		default:
			image = AmanoImages.AMANO_NORMAL[0];
			break;
	}

	const MAX_MESSAGE_LENGTH = 2_000;
	try {
		const response = await openAI.responses.create({
			model: "gpt-5-nano",
			reasoning: { effort: "medium" },
			instructions: `Talk like Ernest Amano from Ace Attorney, who also happens to hate shopping at the BigY grocery store in Franklin, MA. Start the response with 'Now, now', and talk in a way that someone who is ${randomMood} would. Keep your response limited to one or maybe a couple of sentences.`,
			input: message,
		});
		return { content: response.output_text, files: [new AttachmentBuilder(image)] };
	} catch (error) {
		console.error(error);
		return { content: "Now, now, I'm a little tired. Please try again later!" };
	}
}

/**
 * Returns a Promise containing either a message reply or a false value.
 *
 * @param message Message object.
 * @returns Message to reply with on success, false otherwise.
 */
export async function getMessageReply(message) {
	// Don't reply to bot messages
	if (message.author.bot) {
		return false;
	}

	const content = message.content;

	// Handle case where the message starts with "hey ernest"
	if (content.toLowerCase().startsWith("hey ernest")) {
		const [reply] = await Promise.all([getAIReply(content), message.channel.sendTyping()]);
		return reply;
	}

	// Check if the message contains a swear (stop if it doesn't)
	if (!hasSwear(content)) {
		return false;
	}

	// Fetch the replyChance for the channel the message was sent in
	// We want to check if we should reply based on it
	const replyChance = await channelService.getChannelReplyChance(message.channelId);
	if (!(getRandomInt(1, 100) <= replyChance)) {
		return false;
	}

	// Return an object representing a message reply
	const [quote, image] = await Promise.all([getReplyQuote(), getReplyImage()]);
	return { content: quote, files: [new AttachmentBuilder(image)] };
}

export default { getRandomInt, hasSwear, getRandomElement, getReplyQuote, getReplyImage, getAIReply, getMessageReply };
