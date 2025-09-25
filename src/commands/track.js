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

		await interaction.deferReply({ ephemeral: true });

		try {
			const user = await userService.getUser(interaction.user.id);
			const status = sub === "on";
			const subUpper = sub.toUpperCase();
			if (user.trackMessages === status) {
				return interaction.editReply(`Message tracking is already ${bold(subUpper)}.`);
			}

			user.trackMessages = status;
			await user.save();

			return interaction.editReply(`Message tracking ${bold(subUpper)}.`);
		} catch (error) {
			console.error(error);
			return interaction.editReply("Something went wrong while trying to update your message tracking status.");
		}
	},
};
