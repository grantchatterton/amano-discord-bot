import { Collection } from "discord.js";

/**
 * Service for managing Discord channel data and settings.
 * Provides methods to retrieve and update channel-specific configurations,
 * such as reply chance percentages. Uses an in-memory cache backed by
 * a database model for persistent storage.
 */
export default class ChannelService {
	/**
	 * The Sequelize model for the Channel table.
	 *
	 * @type {import('sequelize').ModelStatic<import('sequelize').Model>}
	 */
	#channelModel;

	/**
	 * In-memory cache of channel data using Discord.js Collection.
	 * Maps channelId to channel model instances for fast lookups.
	 *
	 * @type {import('discord.js').Collection<string, import('sequelize').Model>}
	 */
	#channelCollection;

	/**
	 * Creates a new ChannelService instance.
	 *
	 * @param {import('sequelize').ModelStatic<import('sequelize').Model>} channelModel - The Sequelize model for channels
	 */
	constructor(channelModel) {
		this.#channelModel = channelModel;
		this.#channelCollection = new Collection();
	}

	/**
	 * Retrieves a channel by its ID, creating it in the database if it doesn't exist.
	 * Results are cached in memory for subsequent calls.
	 *
	 * @param {string} channelId - The Discord channel ID to retrieve
	 * @returns {Promise<import('sequelize').Model>} The channel model instance
	 */
	async getChannel(channelId) {
		if (!this.#channelCollection.has(channelId)) {
			const [channel] = await this.#channelModel.findOrCreate({ where: { channelId }, defaults: { channelId } });
			this.#channelCollection.set(channelId, channel);
			return channel;
		}

		return this.#channelCollection.get(channelId);
	}

	/**
	 * Gets the reply chance percentage for a specific channel.
	 * The reply chance determines the probability of the bot responding to swear words.
	 *
	 * @param {string} channelId - The Discord channel ID
	 * @returns {Promise<number>} The reply chance percentage (0-100)
	 */
	async getChannelReplyChance(channelId) {
		const channel = await this.getChannel(channelId);
		return channel.replyChance;
	}

	/**
	 * Sets the reply chance percentage for a specific channel and persists it to the database.
	 * Also updates the in-memory cache.
	 *
	 * @param {string} channelId - The Discord channel ID
	 * @param {number} replyChance - The new reply chance percentage (0-100)
	 * @returns {Promise<void>}
	 */
	async setChannelReplyChance(channelId, replyChance) {
		const channel = await this.getChannel(channelId);
		channel.replyChance = replyChance;
		await channel.save();
	}
}
