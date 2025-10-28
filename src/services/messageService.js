import QuickLRU from "quick-lru";
import { Mutex } from "../util/mutex.js";

export default class MessageService {
	#messageModel;

	#openAIClient;

	#messageCollection;

	#mutex;

	#maxMessageLimit;

	constructor(messageModel, openAIClient, maxMessageLimit) {
		this.#messageModel = messageModel;
		this.#openAIClient = openAIClient;
		this.#messageCollection = new QuickLRU({ maxSize: 500 });
		this.#mutex = new Mutex();
		this.#maxMessageLimit = maxMessageLimit;
	}

	async getMessages(guildId) {
		return this.getMessagesUtil(guildId);
	}

	async addMessages(guildId, ...messages) {
		await this.#mutex.lock();

		try {
			await this.saveSummary(guildId, messages);
		} catch (error) {
			console.error(`Error adding messages for guild: ${error}`);
			throw error;
		} finally {
			this.#mutex.release();
		}
	}

	async getSummary(messages) {
		const response = await this.#openAIClient.chat.completions.create({
			model: "gpt-4o-mini",
			max_tokens: 300,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content:
						"You are a helpful assistant who summarizes message history. Respond in JSON format with 'content' (the summary) and 'mimic' (who/what the user asked you to talk like, if applicable) fields.",
				},
				...messages,
			],
		});
		return JSON.parse(response.choices[0].message.content);
	}

	async getMessageData(guildId) {
		if (!this.#messageCollection.has(guildId)) {
			const messageDataToCreate = {
				messages: [],
				summary: null,
				mimic: null,
			};

			try {
				// return plain object to avoid creating a model instance
				const guildMessageData = await this.#messageModel.findOne({
					where: { guildId },
					attributes: ["content", "mimic"],
					raw: true,
				});
				if (guildMessageData) {
					messageDataToCreate.summary = guildMessageData.content;
					messageDataToCreate.mimic = guildMessageData.mimic;
				}
			} catch (error) {
				console.error(`Error fetching message data for guild: ${error}`);
			}

			this.#messageCollection.set(guildId, messageDataToCreate);
		}

		// Return reference (not copy) so mutations are reflected
		return this.#messageCollection.get(guildId);
	}

	async getMessagesUtil(guildId) {
		const messageData = await this.getMessageData(guildId);
		const messages = [];

		// Add summary as context if available
		if (messageData.summary) {
			messages.push({
				role: "system",
				content: `Previous conversation summary: ${messageData.summary}`,
			});
		}

		// Add mimic instruction if user specified one
		if (messageData.mimic) {
			messages.push({
				role: "system",
				content: `Additional instruction: Also imitate the speech style of ${messageData.mimic}, while maintaining your Ernest Amano persona.`,
			});
		}

		// Return copy of messages array to prevent external mutations
		return [...messages, ...messageData.messages];
	}

	async saveSummary(guildId, messages, force = false) {
		// Get reference to cached data (protected by mutex in addMessages)
		const messageData = await this.getMessageData(guildId);
		const newMessages = [...messageData.messages, ...messages];

		if (newMessages.length > 0 && (newMessages.length >= this.#maxMessageLimit || force)) {
			try {
				const summaryMessages = messageData.summary
					? [{ role: "system", content: `Previous summary: ${messageData.summary}` }, ...newMessages]
					: newMessages;
				const summary = await this.getSummary(summaryMessages);
				if (!summary.content) {
					throw new Error("summary.content is undefined!");
				}

				// Update cache atomically (we're inside mutex lock from addMessages)
				messageData.messages = [];
				messageData.summary = summary.content;
				messageData.mimic = summary.mimic;

				try {
					// use upsert to reduce round trips (single statement)
					await this.#messageModel.upsert({ guildId, content: summary.content, mimic: summary.mimic });
				} catch (error) {
					console.error(`Error while saving guild message data to DB: ${error}`);
				}
			} catch (error) {
				console.error(`Error while saving summary: ${error}`);
				// On error, keep accumulated messages (don't lose data)
				messageData.messages = newMessages;
			}
		} else {
			// Haven't reached limit yet, just accumulate messages
			messageData.messages = newMessages;
		}
	}
}
