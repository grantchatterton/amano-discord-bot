import { Collection } from "discord.js";
import Channel from "../models/channel.js";

const channelCollection = new Collection();

export const channelService = {
	async getChannel(channelId) {
		if (channelCollection.has(channelId)) {
			return channelCollection.get(channelId);
		}

		const channel = await Channel.findOne({ where: { channelId } });
		if (channel) {
			channelCollection.set(channelId, channel);
			return channel;
		}

		// Do this so we don't have to store in DB until we manually save it
		const newChannel = Channel.build({ channelId });
		channelCollection.set(channelId, newChannel);
		return newChannel;
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
