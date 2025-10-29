/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "foo",
		description: "Foo!",
	},
	async execute(interaction) {
		await interaction.reply("Foo!");
	},
};
