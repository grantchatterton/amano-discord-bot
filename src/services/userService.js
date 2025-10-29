import { Collection } from "discord.js";

/**
 * Service for managing Discord user data and preferences.
 * Provides methods to retrieve user information with automatic caching
 * and database persistence. Handles user creation and lookup operations.
 */
export default class UserService {
	/**
	 * The Sequelize model for the User table.
	 *
	 * @type {import('sequelize').ModelStatic<import('sequelize').Model>}
	 */
	#userModel;

	/**
	 * In-memory cache of user data using Discord.js Collection.
	 * Maps userId to user model instances for fast lookups.
	 *
	 * @type {import('discord.js').Collection<string, import('sequelize').Model>}
	 */
	#userCollection;

	/**
	 * Creates a new UserService instance.
	 *
	 * @param {import('sequelize').ModelStatic<import('sequelize').Model>} userModel - The Sequelize model for users
	 */
	constructor(userModel) {
		this.#userModel = userModel;
		this.#userCollection = new Collection();
	}

	/**
	 * Retrieves a user by their Discord ID, creating them in the database if they don't exist.
	 * Results are cached in memory for subsequent calls. This implements a find-or-create
	 * pattern with automatic caching.
	 *
	 * @param {string} userId - The Discord user ID to retrieve
	 * @returns {Promise<import('sequelize').Model>} The user model instance
	 */
	async getUser(userId) {
		if (!this.#userCollection.has(userId)) {
			const [user] = await this.#userModel.findOrCreate({ where: { userId }, defaults: { userId } });
			this.#userCollection.set(userId, user);
			return user;
		}

		return this.#userCollection.get(userId);
	}
}
