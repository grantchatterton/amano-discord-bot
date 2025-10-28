import {
	ApplicationCommandOptionType,
	bold,
	channelLink,
	ChannelType,
	InteractionContextType,
	PermissionFlagsBits,
	PermissionsBitField,
} from "discord.js";
import serviceContainer from "../services/serviceContainer.js";

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "chance",
		description: "Set the chance of replying to a message containing a swear for a channel",
		default_member_permissions: PermissionFlagsBits.ManageChannels.toString(),
		contexts: [InteractionContextType.Guild],
		options: [
			{
				name: "channel",
				description: "Text channel to set reply chance for.",
				type: ApplicationCommandOptionType.Channel,
				channel_types: [ChannelType.GuildText],
				required: true,
			},
			{
				name: "value",
				description: "Value to set for the channel's reply chance.",
				type: ApplicationCommandOptionType.Integer,
				required: true,
				min_value: 0,
				max_value: 100,
			},
		],
	},
	async execute(interaction) {
		const channel = interaction.options.getChannel("channel");
		const chance = interaction.options.getInteger("value");

		const member = interaction.member;
		const channelPermissions = channel.permissionsFor(member);
		if (!channelPermissions.has(PermissionsBitField.Flags.ManageChannels)) {
			return interaction.reply({
				content: "You don't have permission to configure that channel.",
				ephemeral: true,
			});
		}

		await interaction.deferReply();

		try {
			const channelService = serviceContainer.resolve("channelService");
			await channelService.setChannelReplyChance(channel.id, chance);
			return await interaction.editReply(`Reply chance for ${channelLink(channel.id)} set to ${bold(chance + "%")}.`);
		} catch (error) {
			console.error(error);
			return interaction.editReply("Something went wrong while attempting to update the reply chance.");
		}
	},
};
