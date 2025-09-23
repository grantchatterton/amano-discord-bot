import { Collection } from "discord.js";
import { sequelize } from "../db/db.js";
import { openAI } from "../openai/openai.js";

const Message = sequelize.model("Message");

const messageCollection = new Collection();

const MAX_LIMIT = 10;

async function getSummary(messages) {
	const response = await openAI.chat.completions.create({
		model: "gpt-5-nano",
		messages: [
			{
				role: "system",
				content:
					"Create a concise summary given the message history. Make sure it can fit within a TEXT column of a SQL database.",
			},
			...messages,
		],
	});
	return { role: "system", content: response.choices[0].message.content };
}

async function updateSummary(guildId, newMessages) {
	if (newMessages.length >= MAX_LIMIT) {
		const summary = await getSummary(newMessages);
		await Message.upsert({ guildId, content: summary.content });
		messageCollection.set(guildId, [summary]);
	} else {
		messageCollection.set(guildId, newMessages);
	}
}

export const messageService = {
	async getMessages(guildId) {
		if (!messageCollection.has(guildId)) {
			const guildMessage = await Message.findOne({ where: { guildId } });
			const guildMessages = guildMessage ? [{ role: "system", content: guildMessage.get("content") }] : [];
			messageCollection.set(guildId, guildMessages);
		}

		const messages = messageCollection.get(guildId);
		return [...messages];
	},
	async addMessage(guildId, message) {
		const messages = await this.getMessages(guildId);
		const newMessages = [...messages, message];
		return updateSummary(guildId, newMessages);
	},
	async addMessages(guildId, ...messages) {
		const oldMessages = await this.getMessages(guildId);
		const newMessages = [...oldMessages, ...messages];
		return updateSummary(guildId, newMessages);
	},
};
