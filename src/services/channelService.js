import { Collection } from "discord.js";
import { MESSAGE_REPLY_CHANCE } from "../config.js";
import Channel from "../models/channel.js";

const channelCollection = new Collection();

export const channelService = {
	async addChannel(channelId) {
		if (channelCollection.has(channelId)) {
			return channelCollection.get(channelId);
		}

		const [channel] = await Channel.findOrCreate({ where: { channelId } });
		channelCollection.set(channelId, channel);
		return channel;
	},
	async getChannel(channelId) {
		if (channelCollection.has(channelId)) {
			return channelCollection.get(channelId);
		}

		const channel = await Channel.findOne({ where: { channelId } });
		if (channel) {
			channelCollection.set(channelId, channel);
		}

		return channel;
	},
	async getChannelReplyChance(channelId) {
		const channel = await this.getChannel(channelId);
		return channel ? channel.replyChance : MESSAGE_REPLY_CHANCE;
	},
	async setChannelReplyChance(channelId, replyChance) {
		const channel = await this.addChannel(channelId);
		channel.replyChance = replyChance;
		await channel.save();
		return channel;
	},
};

export default channelService;
