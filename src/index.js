import process from "node:process";
import { URL } from "node:url";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import OpenAI from "openai";
import { MAX_MESSAGE_LIMIT } from "./config.js";
import { sequelize } from "./db/db.js";
import { initDB } from "./db/dbInit.js";
import ChannelService from "./services/channelService.js";
import MessageService from "./services/messageService.js";
import serviceContainer from "./services/serviceContainer.js";
import UserService from "./services/userService.js";
import { loadCommands, loadEvents } from "./util/loaders.js";
import { registerEvents } from "./util/registerEvents.js";

// Initialize the DB
await initDB();

// Initialize services
// OpenAI is optional - if API key is not provided, AI features will be disabled
const openAIClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
serviceContainer.register("openAI", openAIClient);

serviceContainer.register("channelService", new ChannelService(sequelize.models.Channel));
serviceContainer.register(
	"messageService",
	new MessageService(sequelize.models.Message, openAIClient, MAX_MESSAGE_LIMIT),
);
serviceContainer.register("userService", new UserService(sequelize.models.User));

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
		console.log("Client successfully destroyed!");
		process.exit(0);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
