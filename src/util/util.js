import { AttachmentBuilder } from "discord.js";
import { MESSAGE_REPLY_IMAGE } from "../config.js";
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
 * Returns a Promise containing a reply quote.
 *
 * @returns {Promise<string>} Random quote.
 */
export async function getReplyQuote() {
	return AMANO_QUOTES[getRandomInt(0, AMANO_QUOTES.length - 1)];
}

/**
 * Returns a Promise containing an image URL for replying to a message.
 *
 * @returns {Promise<string>} Image URL.
 */
export async function getReplyImage() {
	return MESSAGE_REPLY_IMAGE;
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

	// Check if the message contains a swear (stop if it doesn't)
	if (!hasSwear(message.content)) {
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
	return {
		content: quote,
		files: [new AttachmentBuilder(image)],
	};
}

export default {
	getRandomInt,
	hasSwear,
	getReplyQuote,
	getReplyImage,
	getMessageReply,
};
