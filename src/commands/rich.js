/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "rich",
		description: "Send a picture of ReviewTechUSA",
	},
	async execute(interaction) {
		await interaction.reply(
			"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdOObsk6LpuM2Qlxn9w0CM-0uJdc7PJYaaaW1CabNAFYLqI0-Ahbb3qO4&s=10",
		);
	},
};
