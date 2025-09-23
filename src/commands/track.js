import { ApplicationCommandOptionType, bold } from "discord.js";
import { userService } from "../services/userService.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "track",
		description: "Allows users to opt in/out of having their messages tracked.",
		options: [
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "on",
				description: "Opt-in to message tracking.",
			},
			{
				type: ApplicationCommandOptionType.Subcommand,
				name: "off",
				description: "Opt-out of message tracking.",
			},
		],
	},
	async execute(interaction) {
		const sub = interaction.options.getSubcommand();

		try {
			const user = await userService.getUser(interaction.user.id);
			const status = sub === "on";
			const subUpper = sub.toUpperCase();
			if (user.trackMessages === status) {
				return interaction.reply({ content: `Message tracking is already ${bold(subUpper)}.`, ephemeral: true });
			}

			user.trackMessages = status;

			await user.save();
			return interaction.reply({ content: `Message tracking ${bold(subUpper)}.`, ephemeral: true });
		} catch (error) {
			console.error(error);
			return interaction.reply({ content: "Something went wrong, please try again!", ephemeral: true });
		}
	},
};
