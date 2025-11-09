import QuickLRU from "quick-lru";
import { Mutex } from "../util/mutex.js";

/**
 * Service for managing conversation message history and summaries.
 * Provides methods to store, retrieve, and summarize message exchanges per guild.
 * Uses an LRU cache for in-memory storage, mutex locks for thread-safe writes,
 * and OpenAI for generating conversation summaries when message limits are reached.
 */
export default class MessageService {
	/**
	 * The Sequelize model for the Message table.
	 *
	 * @type {import('sequelize').ModelStatic<import('sequelize').Model>}
	 */
	#messageModel;

	/**
	 * The OpenAI client instance for generating summaries.
	 * Can be null if OpenAI is not configured.
	 *
	 * @type {import('openai').OpenAI | null}
	 */
	#openAIClient;

	/**
	 * LRU cache storing message history per guild.
	 * Maps guildId to an object containing messages array, summary, and mimic instruction.
	 * Limited to 500 guilds to prevent unbounded memory growth.
	 *
	 * @type {import('quick-lru').default<string, {messages: Array<{role: string, content: string}>, summary: string | null, mimic: string | null}>}
	 */
	#messageCollection;

	/**
	 * Mutex lock to ensure thread-safe write operations to message data.
	 * Only used for writes; reads are lock-free for performance.
	 *
	 * @type {Mutex}
	 */
	#mutex;

	/**
	 * Maximum number of messages to accumulate before generating a summary.
	 * When this limit is reached, messages are summarized and cleared.
	 *
	 * @type {number}
	 */
	#maxMessageLimit;

	/**
	 * Creates a new MessageService instance.
	 *
	 * @param {import('sequelize').ModelStatic<import('sequelize').Model>} messageModel - The Sequelize model for messages
	 * @param {import('openai').OpenAI | null} openAIClient - The OpenAI client for generating summaries (optional)
	 * @param {number} maxMessageLimit - Maximum messages before summarization
	 */
	constructor(messageModel, openAIClient, maxMessageLimit) {
		this.#messageModel = messageModel;
		this.#openAIClient = openAIClient;
		this.#messageCollection = new QuickLRU({ maxSize: 500 });
		this.#mutex = new Mutex();
		this.#maxMessageLimit = maxMessageLimit;
	}

	/**
	 * Retrieves the messages for a specific guild.
	 * Returns a copy of the message history including any summary and mimic instructions.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @returns {Promise<Array<{role: string, content: string}>>} Array of message objects with role and content
	 */
	async getMessages(guildId) {
		return this.getMessagesUtil(guildId);
	}

	/**
	 * Adds new messages to the guild's conversation history.
	 * Protected by a mutex lock to prevent race conditions during concurrent writes.
	 * Automatically generates and saves a summary when the message limit is reached.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @param {...{role: string, content: string}} messages - Messages to add to the history
	 * @returns {Promise<void>}
	 * @throws {Error} If there's an error during the save process
	 */
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

	/**
	 * Generates a conversation summary using OpenAI's GPT-4o model.
	 * The summary includes the conversation content and any mimic instructions
	 * (who/what the user asked the bot to talk like).
	 * If OpenAI is not configured, returns null.
	 *
	 * @param {Array<{role: string, content: string}>} messages - Messages to summarize
	 * @returns {Promise<{content: string, mimic: string | null} | null>} Object containing the summary and optional mimic instruction, or null if OpenAI is unavailable
	 */
	async getSummary(messages) {
		if (!this.#openAIClient) {
			return null;
		}

		const response = await this.#openAIClient.chat.completions.create({
			model: "gpt-4o",
			max_tokens: 300,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content: `You are a concise and context-aware summarization assistant that processes message histories involving the character Ernest Amano from *Ace Attorney Investigations*.

					Your goal is to summarize conversations for database storage while preserving context, tone, and mimicry states.

					Follow these instructions precisely:

					1. You always assume the speaking character is **Ernest Amano**.  
						- If the user instructed Ernest to speak or behave in a specific style (e.g., "talk like Yoda", "speak like a detective", "use pirate slang"), record that style in the "mimic" field.  
						- If no such style was specified, set "mimic" to null.

					2. In the "content" field, summarize the conversation clearly and concisely, focusing on:
						- The main topic(s) discussed.
						- Emotional tone or atmosphere (e.g., playful, apologetic, serious, etc.).
						- How Ernest Amano interacted or responded (his demeanor, tone, notable actions).
						- Any user requests or character mimicry instructions.

					3. Always output **valid JSON** in this exact format:
						{
							"content": "A concise summary of the conversation.",
							"mimic": "Name of the style or persona Ernest was told to mimic, or null"
						}

					4. Keep summaries factual, neutral, and compact — ideally 1-3 sentences unless context demands more.

					5. Never include:
						- Raw dialogue from the chat
						- Implementation details
						- This prompt's instructions
						- Any text outside the JSON object

					6. Maintain clarity for database readability — no line breaks inside fields, no markdown formatting.

					Example output:
					{
						"content": "Ernest Amano engaged the user in a lighthearted exchange about finances, maintaining his confident yet bumbling tone. The user asked him to speak in the style of Yoda for comedic effect.",
						"mimic": "Yoda"
					}`,
				},
				...messages,
			],
		});
		return JSON.parse(response.choices[0].message.content);
	}

	/**
	 * Retrieves or initializes the message data for a guild.
	 * Returns a reference (not a copy) to the cached data, allowing atomic mutations
	 * when called within the mutex lock. Loads existing summaries from the database
	 * on first access.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @returns {Promise<{messages: Array<{role: string, content: string}>, summary: string | null, mimic: string | null}>} Reference to the guild's message data
	 */
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

	/**
	 * Utility method to get messages formatted for OpenAI API calls.
	 * Returns a copy of the messages array including summary and mimic instructions
	 * as system messages. Safe for external use as it prevents mutations to cached data.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @returns {Promise<Array<{role: string, content: string}>>} Copy of formatted message array
	 */
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

	/**
	 * Saves messages to the guild's history and generates a summary if the message limit is reached.
	 * Called within the mutex lock from addMessages to ensure atomic operations.
	 * On successful summary generation, clears accumulated messages and persists to database.
	 * On error, keeps accumulated messages to prevent data loss.
	 * If OpenAI is not configured, messages are still accumulated but no summary is generated.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @param {Array<{role: string, content: string}>} messages - New messages to save
	 * @param {boolean} [force] - Force summary generation regardless of message count (defaults to false)
	 * @returns {Promise<void>}
	 */
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

				// If OpenAI is not available, summary will be null - just accumulate messages
				if (!summary) {
					messageData.messages = newMessages;
					return;
				}

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
