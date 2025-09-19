import "./config.js";
import process from "node:process";
import { URL } from "node:url";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { loadCommands, loadEvents } from "./util/loaders.js";
import { registerEvents } from "./util/registerEvents.js";

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Channel],
});

// Load the events and commands
const events = await loadEvents(new URL("events/", import.meta.url));
const commands = await loadCommands(new URL("commands/", import.meta.url));

// Register the event handlers
registerEvents(commands, events, client);

// Login to the client
void client.login(process.env.DISCORD_TOKEN);

// Terminate peacefully when "SIGINT" or "SIGTERM" received
async function shutdown() {
	try {
		await client.destroy();
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
