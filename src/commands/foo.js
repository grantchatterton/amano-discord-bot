/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "foo",
		description: "Responds with foo",
	},
	async execute(interaction) {
		await interaction.reply("foo");
	},
};
