import dayjs from "dayjs";
import { Collection } from "discord.js";
import { Op } from "sequelize";

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

	/**
	 * Get all users from the database.
	 *
	 * @returns {Promise<import('sequelize').Model[]>} Array of user model instances
	 */
	async getAllUsers(options = {}) {
		return this.#userModel.findAll(options);
	}

	/**
	 * Get all users with a birthday on a specific month and day.
	 *
	 * @param {number} month - The month (1-12)
	 * @param {number} day - The day (1-31)
	 * @returns {Promise<import('sequelize').Model[]>} Array of user model instances
	 */
	async getUsersByBirthday(month, day) {
		return this.#userModel.findAll({
			where: {
				birthday: {
					[Op.ne]: null,
				},
				[Op.and]: [
					this.#userModel.sequelize.where(
						this.#userModel.sequelize.fn("MONTH", this.#userModel.sequelize.col("birthday")),
						month,
					),
					this.#userModel.sequelize.where(
						this.#userModel.sequelize.fn("DAY", this.#userModel.sequelize.col("birthday")),
						day,
					),
				],
			},
		});
	}

	/**
	 * Get all users with a birthday today.
	 *
	 * @returns {Promise<import('sequelize').Model[]>} Array of user model instances
	 */
	async getUsersWithBirthdayToday() {
		const date = dayjs().tz("America/New_York");
		return this.getUsersByBirthday(date.month() + 1, date.date());
	}
}
