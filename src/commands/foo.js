/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "foo",
		description: "Responds with bar",
	},
	async execute(interaction) {
		await interaction.reply("bar");
	},
};
