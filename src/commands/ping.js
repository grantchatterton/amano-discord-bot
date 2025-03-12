/** @type {import('./index.js').Command} */
export default {
	data: {
		name: 'ping',
		description: 'Pong!',
	},
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};
