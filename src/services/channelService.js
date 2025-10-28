import { Collection } from "discord.js";

export default class ChannelService {
	#channelModel;

	#channelCollection;

	constructor(channelModel) {
		this.#channelModel = channelModel;
		this.#channelCollection = new Collection();
	}

	async getChannel(channelId) {
		if (!this.#channelCollection.has(channelId)) {
			const [channel] = await this.#channelModel.findOrCreate({ where: { channelId }, defaults: { channelId } });
			this.#channelCollection.set(channelId, channel);
			return channel;
		}

		return this.#channelCollection.get(channelId);
	}

	async getChannelReplyChance(channelId) {
		const channel = await this.getChannel(channelId);
		return channel.replyChance;
	}

	async setChannelReplyChance(channelId, replyChance) {
		const channel = await this.getChannel(channelId);
		channel.replyChance = replyChance;
		await channel.save();
	}
}
