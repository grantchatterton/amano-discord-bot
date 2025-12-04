import { Collection } from "discord.js";
import { Op } from "sequelize";

/**
 * Service for managing Discord guild data and settings.
 * Provides methods to retrieve and update guild-specific configurations,
 * such as the birthday announcement channel. Uses an in-memory cache backed by
 * a database model for persistent storage.
 */
export default class GuildService {
	/**
	 * The Sequelize model for the Guild table.
	 *
	 * @type {import('sequelize').ModelStatic<import('sequelize').Model>}
	 */
	#guildModel;

	/**
	 * In-memory cache of guild data using Discord.js Collection.
	 * Maps guildId to guild model instances for fast lookups.
	 *
	 * @type {import('discord.js').Collection<string, import('sequelize').Model>}
	 */
	#guildCollection;

	/**
	 * Creates a new GuildService instance.
	 *
	 * @param {import('sequelize').ModelStatic<import('sequelize').Model>} guildModel - The Sequelize model for guilds
	 */
	constructor(guildModel) {
		this.#guildModel = guildModel;
		this.#guildCollection = new Collection();
	}

	/**
	 * Retrieves a guild by its ID, creating it in the database if it doesn't exist.
	 * Results are cached in memory for subsequent calls.
	 *
	 * @param {string} guildId - The Discord guild ID to retrieve
	 * @returns {Promise<import('sequelize').Model>} The guild model instance
	 */
	async getGuild(guildId) {
		if (!this.#guildCollection.has(guildId)) {
			const [guild] = await this.#guildModel.findOrCreate({ where: { guildId }, defaults: { guildId } });
			this.#guildCollection.set(guildId, guild);
			return guild;
		}

		return this.#guildCollection.get(guildId);
	}

	/**
	 * Get all guilds from the database.
	 *
	 * @returns {Promise<import('sequelize').Model[]>} Array of guild model instances
	 */
	async getAllGuilds(options = {}) {
		return this.#guildModel.findAll(options);
	}

	/**
	 * Get all guilds that have a birthday webhook URL configured.
	 *
	 * @returns {Promise<import('sequelize').Model[]>} Array of guild model instances
	 */
	async getGuildsWithBirthdayWebhook(options = {}) {
		const whereClause = { birthdayWebhookUrl: { [Op.ne]: null } };
		if (options.where) {
			Object.assign(whereClause, options.where);
		}

		return this.#guildModel.findAll({ ...options, where: whereClause });
	}

	/**
	 * Gets the birthday announcement webhook URL for a specific guild.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @returns {Promise<string | null>} The webhook URL or null if not configured
	 */
	async getBirthdayWebhookUrl(guildId) {
		const guild = await this.getGuild(guildId);
		return guild.birthdayWebhookUrl;
	}

	/**
	 * Sets the birthday announcement webhook URL for a specific guild and persists it to the database.
	 * Also updates the in-memory cache.
	 *
	 * @param {string} guildId - The Discord guild ID
	 * @param {string | null} webhookUrl - The webhook URL for birthday announcements or null to unset
	 * @returns {Promise<void>}
	 */
	async setBirthdayWebhookUrl(guildId, webhookUrl) {
		const guild = await this.getGuild(guildId);
		guild.birthdayWebhookUrl = webhookUrl;
		await guild.save();
	}
}
