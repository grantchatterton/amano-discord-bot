import { MESSAGE_REPLY_CHANCE, MESSAGE_REPLY_IMAGE } from '../config.js';
import { AMANO_QUOTES } from '../quotes.js';
import { SWEAR_PATTERNS } from '../swears.js';

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
 * Returns whether we should reply to a message.
 *
 * @returns {boolean} True if we should reply, false otherwise.
 */
export function shouldReplyToMessage() {
	return getRandomInt(1, 100) <= MESSAGE_REPLY_CHANCE;
}

/**
 * Returns a Promise containing a random quote
 *
 * @returns {Promise<string>} Random quote.
 */
export async function getRandomQuote() {
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

export default {
	getRandomInt,
	hasSwear,
	shouldReplyToMessage,
	getRandomQuote,
	getReplyImage,
};
