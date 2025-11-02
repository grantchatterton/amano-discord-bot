import { getRandomInt } from "../util/util.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "flip",
		description: "Flip a coin",
	},
	async execute(interaction) {
		const result = getRandomInt(0, 1) === 0 ? "Heads" : "Tails";
		await interaction.reply(result);
	},
};
