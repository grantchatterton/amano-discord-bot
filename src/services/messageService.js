import { Collection } from "discord.js";
import { sequelize } from "../db/db.js";
import { openAI } from "../openai/openai.js";

const Message = sequelize.model("Message");

const messageCollection = new Collection();

const MAX_LIMIT = 50;

async function getSummary(messages) {
	const response = await openAI.chat.completions.create({
		model: "gpt-5",
		messages: [
			{
				role: "system",
				content: "Create a concise summary of the message history.",
			},
			...messages,
		],
	});
	return { role: "system", content: response.choices[0].message.content };
}

async function updateSummary(guildId, newMessages) {
	if (newMessages.length >= MAX_LIMIT) {
		const summary = await getSummary(newMessages);
		messageCollection.set(guildId, [summary]);
				Message.upsert({ guildId, content: summary.content })
					.catch(error => console.error("Error updating summary in DB: " + error));
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
			return [...guildMessages];
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
