import { MESSAGE_CHANCE, MESSAGE_FUNNY_CHANCE, MESSAGE_FUNNY_COOLDOWN } from './config.js';
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
export function getRandomInt(min, max) {
	const randNum = Math.floor(Math.random() * (max - min + 1)) + min;
	console.log(`randNum = ${randNum}`);
	return randNum;
}

// Helper function to determine if we should reply with the funny image
let lastFunnyMessage = 0;
export function shouldSendFunnyImage() {
	if (getRandomInt(1, 100) <= MESSAGE_FUNNY_CHANCE) {
		const currSecs = Math.floor(Date.now() / 1_000); // seconds since epoch
		const elapsedSecs = currSecs - lastFunnyMessage; // elapsed time since the last funny message was sent
		if (elapsedSecs >= MESSAGE_FUNNY_COOLDOWN) {
			lastFunnyMessage = currSecs;
			return true;
		}
	}

	return false;
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
