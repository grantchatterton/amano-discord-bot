import { Collection } from "discord.js";
import { sequelize } from "../db/db.js";

const User = sequelize.models.User;

const userCollection = new Collection();

export const userService = {
	async getUser(userId) {
		if (!userCollection.has(userId)) {
			const [user] = await User.findOrCreate({ where: { userId }, defaults: { userId } });
			userCollection.set(userId, user);
			return user;
		}

		return userCollection.get(userId);
	},
};
