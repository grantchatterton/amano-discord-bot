import { Collection } from 'discord.js';

const replies = new Collection();

export function addReply(text, reply) {
	replies.set(text, reply);
}

export function getReply(text) {
	return replies.get(text);
}

export function hasReply(text) {
	return replies.has(text);
}

export default {
	addReply,
	getReply,
	hasReply,
};
