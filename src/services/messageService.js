import process from "node:process";
import { Collection } from "discord.js";
import { sequelize } from "../db/db.js";
import { openAI } from "../openai/openai.js";
import { Mutex } from "../util/mutex.js";

const DEFAULT_MAX_MESSAGE_LIMIT = 20;

let MAX_MESSAGE_LIMIT;
const parsedMaxMessageLimit = Number.parseInt(process.env.MAX_MESSAGE_LIMIT, 10);
if (Number.isNaN(parsedMaxMessageLimit)) {
	console.log(`Failure parsing process.env.MAX_MESSAGE_LIMIT! Defaulting to ${DEFAULT_MAX_MESSAGE_LIMIT}.`);
	MAX_MESSAGE_LIMIT = DEFAULT_MAX_MESSAGE_LIMIT;
} else {
	MAX_MESSAGE_LIMIT = parsedMaxMessageLimit;
}

const Message = sequelize.model("Message");

const messageCollection = new Collection();

const mutex = new Mutex();

async function getSummary(messages) {
	const response = await openAI.chat.completions.create({
		model: "gpt-3.5-turbo",
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
		messages: [
			{
				role: "system",
				content: "Write a detailed summary of the conversation.",
			},
			...messages,
		],
	});
	return { role: "system", content: response.choices[0].message.content };
}

async function getMessagesUtil(guildId) {
	if (!messageCollection.has(guildId)) {
		let guildMessages = [];
		try {
			const guildMessage = await Message.findOne({ where: { guildId } });
			if (guildMessage) {
				guildMessages = [{ role: "system", content: guildMessage.get("content") }];
			}
		} catch (error) {
			console.error(`Error fetching message for guild: ${error}`);
		}

		messageCollection.set(guildId, guildMessages);
		return [...guildMessages];
	}

	return [...messageCollection.get(guildId)];
}

async function saveSummary(guildId, newMessages) {
	if (newMessages.length >= MAX_MESSAGE_LIMIT) {
		try {
			const summary = await getSummary(newMessages);
			messageCollection.set(guildId, [summary]);
			// console.log(`summary = ${summary}`);

			try {
				await Message.upsert({ guildId, content: summary.content });
			} catch (error) {
				console.error(`Error saving summary to DB: ${error}`);
			}
		} catch (error) {
			console.error(`Error saving summary of messages: ${error}`);
			messageCollection.set(guildId, newMessages);
		}
	} else {
		messageCollection.set(guildId, newMessages);
	}
}

export const messageService = {
	async getMessages(guildId) {
		await mutex.lock();

		try {
			return await getMessagesUtil(guildId);
		} catch (error) {
			console.error(`Error fetching messages for guild: ${error}`);
			throw error;
		} finally {
			mutex.release();
		}
	},
	async addMessages(guildId, ...messages) {
		await mutex.lock();

		try {
			const oldMessages = await getMessagesUtil(guildId);
			const newMessages = [...oldMessages, ...messages];
			await saveSummary(guildId, newMessages);
		} catch (error) {
			console.error(`Error adding messages for guild: ${error}`);
			throw error;
		} finally {
			mutex.release();
		}
	},
};
