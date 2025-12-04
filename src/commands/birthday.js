import dayjs from "dayjs";
import { ApplicationCommandOptionType, bold, channelMention } from "discord.js";
import serviceContainer from "../services/serviceContainer.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "birthday",
		description: "Manage your birthday and birthday announcements",
		options: [
			{
				name: "get",
				description: "Get your currently set birthday",
				type: ApplicationCommandOptionType.Subcommand,
			},
			{
				name: "set",
				description: "Set your birthday date",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "date",
						description: "Your birthday date (MM-DD-YYYY)",
						type: ApplicationCommandOptionType.String,
						required: true,
					},
				],
			},
			{
				name: "channel",
				description: "Set the birthday announcement channel for this server (admin only)",
				type: ApplicationCommandOptionType.Subcommand,
				options: [
					{
						name: "channel",
						description: "The channel to post birthday announcements in",
						type: ApplicationCommandOptionType.Channel,
						required: false,
					},
				],
			},
		],
	},
	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();
		if (subcommand === "get") {
			const userService = serviceContainer.resolve("userService");

			await interaction.deferReply({ ephemeral: true });

			try {
				const user = await userService.getUser(interaction.user.id);
				if (user.birthday) {
					await interaction.editReply(`Your birthday is set to ${bold(dayjs(user.birthday).format("MM-DD-YYYY"))}.`);
				} else {
					await interaction.editReply("You have not set your birthday yet.");
				}
			} catch (error) {
				console.error(error);
				await interaction.editReply("An error occurred while retrieving your birthday. Please try again later.");
			}
		} else if (subcommand === "set") {
			const userDate = interaction.options.getString("date");
			const userService = serviceContainer.resolve("userService");

			await interaction.deferReply({ ephemeral: true });

			try {
				const user = await userService.getUser(interaction.user.id);
				user.birthday = dayjs(userDate).toDate();
				await user.save();
				await interaction.editReply(
					`Your birthday has been set to ${bold(dayjs(user.birthday).format("MM-DD-YYYY"))}.`,
				);
			} catch (error) {
				console.error(error);
				await interaction.editReply("An error occurred while setting your birthday. Please try again later.");
			}
		} else {
			if (!interaction.memberPermissions.has("ManageWebhooks")) {
				await interaction.reply("You do not have permission to set the birthday announcement channel.");
				return;
			}

			const channel = interaction.options.getChannel("channel");
			const guildService = serviceContainer.resolve("guildService");

			await interaction.deferReply({ ephemeral: true });

			try {
				if (!channel) {
					await guildService.setBirthdayWebhookUrl(interaction.guildId, null);
					await interaction.editReply("Birthday announcements disabled for this server.");
					return;
				}

				const webhook = await channel.createWebhook({
					name: interaction.client.user.username,
					avatar: interaction.client.user.displayAvatarURL(),
				});
				await guildService.setBirthdayWebhookUrl(interaction.guildId, webhook.url);

				await interaction.editReply(
					`Birthday announcements will be posted in ${channelMention(channel.id)} (${webhook.url}).`,
				);
			} catch (error) {
				console.error(error);
				await interaction.editReply(
					"An error occurred while setting the birthday announcement channel. Please try again later.",
				);
			}
		}
	},
};
