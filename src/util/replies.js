import { Collection } from 'discord.js';

const replies = new Collection();

export function addReply(text, reply) {
	replies.set(text, reply);
}

export function getReply(text) {
	return replies.get(text.trim().toLowerCase());
}

export function hasReply(text) {
	return replies.has(text.trim().toLowerCase());
}

export default {
	addReply,
	getReply,
	hasReply,
};
