import { Collection } from "discord.js";
import { sequelize } from "../db/db.js";

const Channel = sequelize.models.Channel;

const channelCollection = new Collection();

export const channelService = {
	async getChannel(channelId) {
		if (!channelCollection.has(channelId)) {
			const [channel] = await Channel.findOrCreate({ where: { channelId }, defaults: { channelId } });
			channelCollection.set(channelId, channel);
			return channel;
		}

		return channelCollection.get(channelId);
	},
	async getChannelReplyChance(channelId) {
		const channel = await this.getChannel(channelId);
		return channel.replyChance;
	},
	async setChannelReplyChance(channelId, replyChance) {
		const channel = await this.getChannel(channelId);
		channel.replyChance = replyChance;
		await channel.save();
	},
};

export default channelService;
