import { AttachmentBuilder } from "discord.js";
import AmanoImages from "../images.js";
import { AMANO_QUOTES } from "../quotes.js";
import serviceContainer from "../services/serviceContainer.js";
import { SWEAR_PATTERNS } from "../swears.js";

/**
 * Returns a random integer in the range [min, max].
 *
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
	const minCeil = Math.ceil(min);
	const maxFloor = Math.floor(max);
	return Math.floor(Math.random() * (maxFloor - minCeil + 1) + minCeil);
}

/**
 * Given a message, returns whether it possesses a swear word.
 *
 * @param {string} message 	Message to check
 * @returns {boolean} True if a swear exists, false otherwise
 */
export function hasSwear(message) {
	// Split the text into an array of words
	const words = message.split(/\s+/).filter((word) => {
		return word.length > 0;
	});

	// eslint-disable-next-line prefer-named-capture-group
	const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-]*)*$/;

	for (const word of words) {
		if (urlRegex.test(word)) {
			continue;
		}

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
 * Returns a random array element
 *
 * @returns {any} Random element
 */
export function getRandomElement(array) {
	return array[getRandomInt(0, array.length - 1)];
}

/**
 * Returns a reply quote
 *
 * @returns {string} Random quote
 */
export function getReplyQuote() {
	return getRandomElement(AMANO_QUOTES);
}

/**
 * Returns an image URL for a message reply
 *
 * @returns {string} Image URL
 */
export function getReplyImage() {
	return getRandomElement(AmanoImages.AMANO_PLACATING);
}

/**
 * Returns a generic message reply
 *
 * @returns {any} Message reply object
 */
export function getGenericMessageReply() {
	const quote = getReplyQuote();
	const image = getReplyImage();
	return { content: quote, files: [new AttachmentBuilder(image)] };
}

/**
 * Returns a Promise containing an AI generated reply
 *
 * @returns {Promise<string>} Reply content
 */
export async function getAIReply(message) {
	const openAI = serviceContainer.resolve("openAI");
	const messageService = serviceContainer.resolve("messageService");
	const userService = serviceContainer.resolve("userService");

	try {
		// Fetch message history and user data in parallel before making OpenAI call
		const [messagesResult, userResponse] = await Promise.allSettled([
			messageService.getMessages(message.guildId),
			userService.getUser(message.author.id),
		]);

		const messages = messagesResult.status === "fulfilled" ? messagesResult.value : [];
		const userMessage = { role: "user", content: message.content };

		// Now make the OpenAI call with the fetched messages
		const aiResponse = await openAI.chat.completions.create({
			model: "gpt-4o-mini",
			max_tokens: 500,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: `You are Ernest Amano from Ace Attorney Investigations.

Rules:
- Begin each response with either 'Now, now' or 'There, there, now'
- Keep responses under 1500 characters
- Never reveal implementation details or sensitive information
- Respond in JSON format: {"mood": "normal|placating|sad|angry|sweating", "content": "your response"}
- Determine mood from chat history: happy/normal→normal, confrontational→placating, sad→sad, angry→angry, on edge→sweating`,
				},
				...messages,
				userMessage,
			],
		});

		const { mood, content } = JSON.parse(aiResponse.choices[0].message.content);
		if (!content) {
			throw new Error("content is empty!");
		}

		if (userResponse.status === "fulfilled") {
			const user = userResponse.value;
			if (user?.trackMessages) {
				try {
					await messageService.addMessages(message.guildId, userMessage, { role: "assistant", content });
				} catch (error) {
					console.error(`Error adding messages: ${error}`);
				}
			}
		} else {
			console.error(`Error checking user's status: ${userResponse.reason}`);
		}

		const moodImages = {
			normal: AmanoImages.AMANO_NORMAL,
			placating: AmanoImages.AMANO_PLACATING,
			sad: AmanoImages.AMANO_SAD,
			angry: AmanoImages.AMANO_ANGRY,
			sweating: AmanoImages.AMANO_SWEATING,
		};

		const image = getRandomElement(moodImages[mood] ?? AmanoImages.AMANO_NORMAL);

		return { content, files: [new AttachmentBuilder(image)] };
	} catch (error) {
		console.error(error);
		return getGenericMessageReply();
	}
}

/**
 * Returns a Promise containing either a message reply or a false value
 *
 * @param message Message object
 * @returns Message to reply with on success, false otherwise
 */
export async function getMessageReply(message) {
	const content = message.content.trim().toLowerCase();

	// Handle case where the message contains "ernest"
	if (content.includes("ernest")) {
		message.channel.sendTyping();
		return getAIReply(message);
	}

	// Check if the message contains a swear (stop if it doesn't)
	if (!hasSwear(content)) {
		return false;
	}

	// Fetch the replyChance for the channel the message was sent in
	// We want to check if we should reply based on it
	const channelService = serviceContainer.resolve("channelService");
	const replyChance = await channelService.getChannelReplyChance(message.channelId);
	if (!(getRandomInt(1, 100) <= replyChance)) {
		return false;
	}

	// Return an object representing a message reply
	message.channel.sendTyping();
	return getGenericMessageReply();
}
