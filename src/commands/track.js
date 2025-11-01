import { ApplicationCommandOptionType, bold } from "discord.js";
import serviceContainer from "../services/serviceContainer.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "track",
		description: "Allows users to opt in/out of having their messages tracked",
		options: [
			{
				type: ApplicationCommandOptionType.Boolean,
				name: "status",
				description: "Whether you wish to have messages tracked or not",
				required: false,
			},
		],
	},
	async execute(interaction) {
		const status = interaction.options.getBoolean("status");
		const userService = serviceContainer.resolve("userService");

		await interaction.deferReply({ ephemeral: true });

		try {
			const user = await userService.getUser(interaction.member.id);
			if (status !== null && user.trackMessages !== status) {
				user.trackMessages = status;
				await user.save();
			}

			await interaction.editReply({ content: `Message tracking ${bold(user.trackMessages ? "ON" : "OFF")}` });
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: `An error occurred. Please try again later!` });
		}
	},
};
