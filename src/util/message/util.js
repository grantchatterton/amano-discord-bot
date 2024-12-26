import { MESSAGE_CHANCE } from './config.js';
import { AMANO_NOW_NOW_QUOTES } from './quotes.js';
import { SWEAR_WORDS } from './swears.js';

// Helper function to check whether a message string contains a swear found in the "SWEAR_WORDS" array constant
export function hasSwear(message) {
	const words = message
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

// Helper function to generate a random integer between [min, max]
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to determine whether a message should be sent
export function shouldSendMessage() {
	return getRandomInt(1, 100) <= MESSAGE_CHANCE;
}

// Helper function to retrieve a random element from an array
function getRandomArrayElement(array) {
	return array[getRandomInt(0, array.length - 1)];
}

// Helper function to retrieve a random Amano quote
export function getRandomQuote() {
	return getRandomArrayElement(AMANO_NOW_NOW_QUOTES);
}
