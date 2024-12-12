import * as config from './config.js';
import { AMANO_QUOTES, AMANO_NOW_NOW_QUOTES } from './quotes.js';
import { SWEAR_WORDS } from './swears.js';

// Helper function to check whether a message string contains a swear found in the "SWEAR_WORDS" array constant
export function hasSwear(message) {
	const messageLower = message.trim().toLowerCase();
	for (const swear of SWEAR_WORDS) {
		if (messageLower.includes(swear)) {
			return true;
		}
	}

	return false;
}

// Helper function to generate a random integer between [min, max]
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to determine whether a message should be sent
export function shouldSendMessage() {
	return getRandomInt(1, 100) <= config.MESSAGE_CHANCE;
}

// Helper function to retrieve a random element from an array
function getRandomArrayElement(array) {
	return array[getRandomInt(0, array.length - 1)];
}

// Helper function to retrieve a random Amano quote
export function getRandomQuote(isNowNow = true) {
	return getRandomArrayElement(isNowNow ? AMANO_NOW_NOW_QUOTES : AMANO_QUOTES);
}
