import { ApplicationCommandOptionType } from "discord.js";
import { getRandomInt } from "../util/util.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "roll",
		description: "Roll one or more dice",
		options: [
			{
				type: ApplicationCommandOptionType.Integer,
				name: "count",
				description: "Number of dice to roll",
				required: false,
				min_value: 1,
				max_value: 6,
			},
			{
				type: ApplicationCommandOptionType.Integer,
				name: "sides",
				description: "Number of sides on each dice",
				required: false,
				min_value: 2,
				max_value: 10,
			},
		],
	},
	async execute(interaction) {
		const count = interaction.options.getInteger("count") ?? 1;
		const sides = interaction.options.getInteger("sides") ?? 6;

		if (count === 1) {
			await interaction.reply(`You rolled: ${getRandomInt(1, sides)}`);
		} else {
			const response = Array.from(
				{ length: count },
				(_value, index) => `Dice #${index + 1}: ${getRandomInt(1, sides)}`,
			).join("\n");
			await interaction.reply(response);
		}
	},
};
