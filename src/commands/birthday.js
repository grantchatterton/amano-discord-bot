import dayjs from "dayjs";
import { ApplicationCommandOptionType, bold } from "discord.js";
import { ValidationError } from "sequelize";
import serviceContainer from "../services/serviceContainer.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "birthday",
		description: "Set your birthday",
		options: [
			{
				name: "date",
				type: ApplicationCommandOptionType.String, // STRING type
				description: "Your birthday",
				required: true,
			},
		],
	},
	async execute(interaction) {
		const userDate = interaction.options.getString("date");

		const userService = serviceContainer.resolve("userService");

		await interaction.deferReply({ ephemeral: true });

		try {
			const user = await userService.getUser(interaction.user.id);
			user.birthday = dayjs(userDate).toDate();
			await user.save();
			await interaction.editReply(`Your birthday has been set to ${bold(dayjs(user.birthday).format("MM-DD-YYYY"))}.`);
		} catch (error) {
			if (error instanceof ValidationError) {
				await interaction.editReply("Invalid birthday entered. Please try again.");
			} else {
				console.error(error);
				await interaction.editReply("An error occurred while setting your birthday. Please try again later.");
			}
		}
	},
};
