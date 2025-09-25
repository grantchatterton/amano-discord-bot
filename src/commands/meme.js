import axios from "axios";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "meme",
		description: "Send a random meme!",
	},
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const response = await axios.get("https://meme-api.com/gimme");
			return await interaction.editReply(response.data.url);
		} catch (error) {
			console.error(error);
			return interaction.editReply("Something went wrong while fetching a meme.");
		}
	},
};
