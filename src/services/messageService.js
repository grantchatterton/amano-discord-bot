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
		await this.#mutex.lock();

		try {
			return await this.getMessagesUtil(guildId);
		} catch (error) {
			console.error(`Error fetching messages for guild: ${error}`);
			throw error;
		} finally {
			this.#mutex.release();
		}
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
			model: "gpt-5",
			response_format: {
				type: "json_schema",
				json_schema: {
					name: "data",
					schema: {
						type: "object",
						properties: {
							content: {
								type: "string",
								description: "The content of the summary.",
							},
							mimic: {
								type: "string",
								description: "Who or what the user may have instructed you to talk like (if applicable).",
							},
						},
					},
				},
			},
			messages: [
				{
					role: "system",
					content: "You are a helpful assistant who summarizes a message history and responds in JSON format.",
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
			return { ...messageDataToCreate };
		}

		const messageData = this.#messageCollection.get(guildId);
		return { ...messageData };
	}

	async getMessagesUtil(guildId) {
		const messageData = await this.getMessageData(guildId);
		const messages = [];
		if (messageData.summary) {
			messages.push({
				role: "developer",
				content: `Here's a summary of the past chat history. Use it as a reference: ${messageData.summary}`,
			});
		}

		if (messageData.mimic) {
			messages.push({
				role: "developer",
				content: `Talk like you are ${messageData.mimic}, though maintain your persona as Ernest Amano.`,
			});
		}

		return [...messages, ...messageData.messages];
	}

	async saveSummary(guildId, messages, force = false) {
		const messageData = await this.getMessageData(guildId);
		const newMessages = [...messageData.messages, ...messages];
		if (newMessages.length > 0 && (newMessages.length >= this.#maxMessageLimit || force)) {
			try {
				const summaryMessages = messageData.summary
					? [{ role: "developer", content: messageData.summary }, ...newMessages]
					: newMessages;
				const summary = await this.getSummary(summaryMessages);
				if (!summary.content) {
					throw new Error("summary.content is undefined!");
				}

				const newMessageData = {
					messages: [],
					summary: summary.content,
					mimic: summary.mimic,
				};

				this.#messageCollection.set(guildId, newMessageData);

				try {
					// use upsert to reduce round trips (single statement)
					await this.#messageModel.upsert({ guildId, content: summary.content, mimic: summary.mimic });
				} catch (error) {
					console.error(`Error while saving guild message data to DB: ${error}`);
				}
			} catch (error) {
				console.error(`Error while saving summary: ${error}`);
				this.#messageCollection.set(guildId, {
					...messageData,
					messages: newMessages,
				});
			}
		} else {
			this.#messageCollection.set(guildId, {
				...messageData,
				messages: newMessages,
			});
		}
	}
}
