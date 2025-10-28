import { Collection } from "discord.js";

export default class UserService {
	#userModel;

	#userCollection;

	constructor(userModel) {
		this.#userModel = userModel;
		this.#userCollection = new Collection();
	}

	async getUser(userId) {
		if (!this.#userCollection.has(userId)) {
			const [user] = await this.#userModel.findOrCreate({ where: { userId }, defaults: { userId } });
			this.#userCollection.set(userId, user);
			return user;
		}

		return this.#userCollection.get(userId);
	}
}
