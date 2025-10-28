import { ApplicationCommandOptionType } from "discord.js";
import { getAIReply } from "../util/util.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "ernest",
		description: "Send a message to Ernest Amano",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "message",
				description: "Message to send",
				required: true,
			},
		],
	},
	async execute(interaction) {
		const message = interaction.options.getString("message");

		await interaction.deferReply();

		const response = await getAIReply({
			author: interaction.member,
			content: message,
			guildId: interaction.guildId,
		});
		await interaction.editReply(response);
	},
};
