/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "foo",
		description: "Replies with bar",
	},
	async execute(interaction) {
		await interaction.reply("bar");
	},
};
