/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "bar",
		description: "Responds with bar",
	},
	async execute(interaction) {
		await interaction.reply("bar");
	},
};
