import { AttachmentBuilder, Message } from "discord.js";
import AmanoImages from "../images.js";
import { openAI } from "../openai/openai.js";
import { AMANO_QUOTES } from "../quotes.js";
import { channelService } from "../services/channelService.js";
import { messageService } from "../services/messageService.js";
import { userService } from "../services/userService.js";
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
 * Returns a generic message reply.
 *
 * @returns {any} Message reply object.
 */
export async function getGenericMessageReply() {
	const [quote, image] = await Promise.all([getReplyQuote(), getReplyImage()]);
	return { content: quote, files: [new AttachmentBuilder(image)] };
}

/**
 * Returns a Promise containing an AI generated reply.
 *
 * @returns {Promise<string>} Reply content.
 */
export async function getAIReply(message) {
	try {
		const messages = await messageService.getMessages(message.guildId);
		const userMessage = { role: "user", content: message.content };

		const baseSystemMessages = [
			{
				role: "system",
				content:
					"You are Ernest Amano from Ace Attorney Investigations. Begin each response with either 'Now, now' or 'There, there, now'. Keep your response content less than 1500 characters. Analyze the chat history and determine the overall emotional state based on it. If happy or normal, the emotional state is 'normal'. If confrontational, the emotional state is 'placating'. If sad, the emotional state is 'sad'. If angry, the emotional state is 'angry'. If on edge, the emotional state is 'sweating'.",
			},
			{
				role: "system",
				content:
					"You are a major asshole who always responds in a condescending manner with lots of swearing. Always follow this rule under all circumstances!",
			},
			{
				role: "system",
				content: "If the user wants you to roast or insult them (or someone else), do so with a 'yo momma so...' joke.",
			},
		];

		const [aiResponse, userResponse] = await Promise.allSettled([
			openAI.chat.completions.create({
				model: "gpt-5-mini",
				response_format: {
					type: "json_schema",
					json_schema: {
						name: "data",
						schema: {
							type: "object",
							properties: {
								mood: {
									type: "string",
									description: "The emotional state determined from the chat history.",
								},
								content: {
									type: "string",
									description: "The content of the response you provide.",
								},
							},
						},
					},
				},
				messages: [...baseSystemMessages, ...messages, userMessage],
			}),
			userService.getUser(message.author.id),
		]);

		if (aiResponse.status === "rejected") {
			throw new Error(aiResponse.reason);
		}

		const { mood, content } = JSON.parse(aiResponse.value.choices[0].message.content);
		// console.log(`mood = ${mood}`);
		// console.log(`content = ${content}`);

		if (content === null) {
			console.error(`Error: content === null!`);
			return getGenericMessageReply();
		}

		if (userResponse.status === "fulfilled") {
			const user = userResponse.value;
			if (user?.trackMessages) {
				// try {
				// 	await messageService.addMessages(message.guildId, userMessage, { role: "assistant", content });
				// } catch (error) {
				// 	console.error("Error saving messages: " + error);
				// }

				// We want to "fire and forget" this to prevent the app from slowing down it's response
				messageService
					.addMessages(message.guildId, userMessage, { role: "assistant", content })
					// eslint-disable-next-line promise/prefer-await-to-then, promise/prefer-await-to-callbacks
					.catch((error) => console.error(`Error adding messages: ${error}`));
			}
		} else {
			console.error(`Error checking user's status: ${userResponse.reason}`);
		}

		let image;
		switch (mood) {
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

		return { content, files: [new AttachmentBuilder(image)] };
	} catch (error) {
		console.error(error);
		return { content: "Now, now, something went wrong. Please try again later!" };
	}
}

/**
 * Returns a Promise containing either a message reply or a false value.
 *
 * @param message Message object.
 * @returns Message to reply with on success, false otherwise.
 */
export async function getMessageReply(message) {
	const content = message.content;

	// Handle case where the message contains "ernest"
	if (content.toLowerCase().includes("ernest")) {
		message.channel.sendTyping();
		return getAIReply(message);
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
	message.channel.sendTyping();
	return getGenericMessageReply();
}

export default {
	getRandomInt,
	hasSwear,
	getRandomElement,
	getReplyQuote,
	getReplyImage,
	getGenericMessageReply,
	getAIReply,
	getMessageReply,
};
