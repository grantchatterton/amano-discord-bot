import { MESSAGE_SWEAR_REPLY_CHANCE } from '../config.js';
import { AMANO_QUOTES } from '../quotes.js';
import { SWEAR_WORDS } from '../swears.js';

/**
 * Returns a random integer in the range [min, max].
 *
 * @param min     Minimum value.
 * @param max     Maximum value.
 * @returns       Random integer.
 */
export function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Returns a random Amano quote.
 *
 * @returns       Random quote.
 */
export function getRandomQuote() {
	return AMANO_QUOTES[Math.floor(Math.random() * AMANO_QUOTES.length)];
}

/**
 * Returns whether or not a string of text contains a swear.
 *
 * @param text    String of text.
 * @returns       True if text contains a swear, false otherwise.
 */
export function hasSwear(text) {
	// Split the text into an array of words
	const words = text
		.trim()
		.toLowerCase()
		.split(/\s+/)
		.filter((word) => {
			return word.length > 0;
		});

	for (const swear of SWEAR_WORDS) {
		if (words.includes(swear)) {
			return true;
		}
	}

	return false;
}

/**
 * Returns whether we should reply to a message containing a swear.
 *
 * @returns       True if we should reply, false otherwise.
 */
export function shouldReplyToMessage() {
	return getRandomInt(1, 100) <= MESSAGE_SWEAR_REPLY_CHANCE;
}

export default {
	getRandomInt,
	getRandomQuote,
	hasSwear,
	shouldReplyToMessage,
};
