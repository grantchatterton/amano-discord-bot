import "./config.js";
import process from "node:process";
import { URL } from "node:url";
import { quote, bold, Client, EmbedBuilder, GatewayIntentBits, Partials, WebhookClient, codeBlock } from "discord.js";
import { initDB } from "./db/dbInit.js";
import { loadCommands, loadEvents } from "./util/loaders.js";
import { registerEvents } from "./util/registerEvents.js";

// Initialize the DB
await initDB();

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

// Implement a custom error handler if an error webhook URL is loaded
const { ERROR_WEBHOOK_URL } = process.env;
if (ERROR_WEBHOOK_URL) {
	const oldConsoleError = console.error;
	console.error = async (...args) => {
		// Log to the original console.error
		oldConsoleError.apply(this, args);

		// Format the error message for Discord
		const errorMessage = args
			.map((arg) => {
				if (typeof arg === "object" && arg !== null) {
					return JSON.stringify(arg);
				}

				return String(arg);
			})
			.join(" ");

		// Attempt to send it to the webhook
		try {
			const webhookClient = new WebhookClient({ url: ERROR_WEBHOOK_URL });
			await webhookClient.send({
				content: `${bold("Error Detected")}\n${codeBlock(errorMessage)}`,
				username: process.env.ERROR_WEBHOOK_USERNAME || "Ernest Amano (Error Reporter)",
				avatarURL: process.env.ERROR_WEBHOOK_AVATAR || "",
			});
		} catch (error) {
			// Log to the original console.error
			oldConsoleError.bind(this, error);
		}
	};

	// Define custom handler for uncaught exceptions
	process.on("uncaughtException", (error) => {
		console.error(error);
		process.exit(1);
	});

	// Define custom handler for uncaught promise rejections
	process.on("unhandledRejection", (error) => {
		console.error(error);
		process.exit(1);
	});
}

if (process.env.NODE_ENV === "development") {
	// Test the custom error handler
	console.error("Test Message");
}

// Terminate peacefully when "SIGINT" or "SIGTERM" received
async function shutdown() {
	try {
		await client.destroy();
		console.log(`Client successfully destroyed!`);
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
