import { channelLink, Collection } from "discord.js";
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
		}

		return channel;
	},
	async addChannel(channelId) {
		if (channelCollection.has(channelId)) {
			return channelCollection.get(channelId);
		}

		const [channel] = await Channel.findOrCreate({ where: { channelId } });
		channelCollection.set(channelId, channel);
		return channel;
	},
};

export default channelService;
