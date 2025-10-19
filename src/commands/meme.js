import axios from "axios";
import { ApplicationCommandOptionType } from "discord.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "meme",
		description: "Send a random meme",
		options: [
			{
				type: ApplicationCommandOptionType.String,
				name: "subreddit",
				description: "Subreddit to fetch the meme from.",
				required: false,
			},
		],
	},
	async execute(interaction) {
		const subreddit = interaction.options.getString("subreddit") ?? "";

		await interaction.deferReply();

		try {
			const response = await axios.get(`https://meme-api.com/gimme/${subreddit}`);
			return await interaction.editReply(response.data.url);
		} catch (error) {
			console.error(error);
			return interaction.editReply("Something went wrong while fetching a meme.");
		}
	},
};
