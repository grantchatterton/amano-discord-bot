/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "rich",
		description: "Send a picture of ReviewTechUSA!",
	},
	async execute(interaction) {
		await interaction.reply("https://exploreprofile.com/wp-content/uploads/2023/08/reviewtechusa.jpg");
	},
};
