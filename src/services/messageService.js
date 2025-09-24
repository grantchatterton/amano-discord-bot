import process from "node:process";
import { Collection } from "discord.js";
import { sequelize, addShutdownListener } from "../db/db.js";
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

async function getMessageData(guildId) {
	if (!messageCollection.has(guildId)) {
		const messageDataToCreate = {
			messages: [],
		};

		try {
			const guildMessageData = await Message.findOne({ where: { guildId }, attributes: ["content", "mimic"] });
			if (guildMessageData) {
				messageDataToCreate.summary = guildMessageData.get("content");
				messageDataToCreate.mimic = guildMessageData.get("mimic");
			}
		} catch (error) {
			console.error(`Error fetching message for guild: ${error}`);
		}

		messageCollection.set(guildId, messageDataToCreate);
		return { ...messageDataToCreate };
	}

	const messageData = messageCollection.get(guildId);
	return { ...messageData };
}

async function getMessagesUtil(guildId) {
	const messageData = await getMessageData(guildId);
	const utilMessages = [];
	if (messageData.summary) {
		utilMessages.push({ role: "system", content: messageData.summary });
	}

	if (messageData.mimic) {
		utilMessages.push({
			role: "system",
			content: `Talk like you are ${messageData.mimic}. If the user has told you to stop talking like it, follow their demand.`,
		});
	}

	return [...utilMessages, ...messageData.messages];
}

async function saveSummary(guildId, messages, force = false) {
	const messageData = await getMessageData(guildId);
	const newMessages = [...messageData.messages, ...messages];
	if (newMessages.length > 0 && (newMessages.length >= MAX_MESSAGE_LIMIT || force)) {
		try {
			const summaryMessages = messageData.summary
				? [{ role: "system", content: messageData.summary }, ...newMessages]
				: newMessages;
			const summary = await getSummary(summaryMessages);
			if (!summary.content) {
				throw new Error("summary.content is undefined!");
			}

			const newMessageData = {
				messages: [],
				summary: summary.content,
				mimic: summary.mimic,
			};

			messageCollection.set(guildId, newMessageData);

			try {
				const [guildMessage, created] = await Message.findOrBuild({
					where: { guildId },
					defaults: { content: summary.content },
				});

				if (!created) {
					guildMessage.set("content", summary.content);
				}

				if (summary.mimic) {
					guildMessage.set("mimic", summary.mimic);
				}

				await guildMessage.save();
			} catch (error) {
				console.error(`Error while saving guild message to DB: ${error}`);
			}
		} catch (error) {
			console.error(`Error while saving summary: ${error}`);
			messageCollection.set(guildId, {
				...messageData,
				messages: newMessages,
			});
		}
	} else {
		messageCollection.set(guildId, {
			...messageData,
			messages: newMessages,
		});
	}
}

addShutdownListener(async () => {
	console.log("Saving summaries...");

	await Promise.allSettled(
		Array.from(messageCollection.keys()).map(async (guildId) => {
			await saveSummary(guildId, [], true);
		}),
	);
});

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
			await saveSummary(guildId, messages);
		} catch (error) {
			console.error(`Error adding messages for guild: ${error}`);
			throw error;
		} finally {
			mutex.release();
		}
	},
};
