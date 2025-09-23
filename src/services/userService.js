import { Collection } from "discord.js";
import { sequelize } from "../db/db.js";

const User = sequelize.model("User");

const userCollection = new Collection();

export const userService = {
	async getUser(userId) {
		if (!userCollection.has(userId)) {
			const [user] = await User.findOrBuild({ where: { userId } });
			userCollection.set(userId, user);
			return user;
		}

		return userCollection.get(userId);
	},
};
