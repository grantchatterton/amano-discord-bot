import process from "node:process";
import { URL } from "node:url";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import OpenAI from "openai";
import { MAX_MESSAGE_LIMIT } from "./config.js";
import { sequelize } from "./db/db.js";
import { initDB } from "./db/dbInit.js";
import ChannelService from "./services/channelService.js";
import GuildService from "./services/guildService.js";
import MessageService from "./services/messageService.js";
import serviceContainer from "./services/serviceContainer.js";
import UserService from "./services/userService.js";
import { loadCommands, loadEvents } from "./util/loaders.js";
import { registerEvents } from "./util/registerEvents.js";

dayjs.extend(utc);
dayjs.extend(timezone);

// Initialize the DB
await initDB();

// Initialize services
// OpenAI is optional - if API key is not provided, AI features will be disabled
const openAIClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
serviceContainer.register("openAI", openAIClient);
serviceContainer.register("channelService", new ChannelService(sequelize.models.Channel));
serviceContainer.register("guildService", new GuildService(sequelize.models.Guild));
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
		GatewayIntentBits.GuildMembers,
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

// Schedule daily birthday checks at 8:00 AM EST
// cron.schedule("0 8 * * *", async () => {
// 	const guildService = serviceContainer.resolve("guildService");
// 	const userService = serviceContainer.resolve("userService");

// 	try {
// 		// Get users with birthdays today
// 		const birthdayUsers = await userService.getUsersWithBirthdayToday();

// 		// Group users by their guild's birthday webhook URL
// 		const webhooksToAnnounce = new Map(); // webhookUrl -> [users]
// 		const guilds = await guildService.getGuildsWithBirthdayWebhook();
// 		for (const guild of guilds) {
// 			// Try to fetch the current guild from the client cache
// 			const clientGuild = client.guilds.cache.get(guild.guildId);
// 			if (!clientGuild) {
// 				continue;
// 			}

// 			// Fetch the list of members in the current guild
// 			const clientGuildMembers = await clientGuild.members.fetch();
// 			const clientGuildMembersWithBirthdays = birthdayUsers.filter((user) => clientGuildMembers.has(user.userId));
// 			if (clientGuildMembersWithBirthdays.length === 0) {
// 				continue;
// 			}

// 			const webhookUrl = guild.birthdayWebhookUrl;
// 			webhooksToAnnounce.set(webhookUrl, clientGuildMembersWithBirthdays);
// 		}

// 		// Announce birthdays via webhooks
// 		for (const [webhookUrl, users] of webhooksToAnnounce.entries()) {
// 			try {
// 				const webhookClient = new WebhookClient({ url: webhookUrl });
// 				for (const user of users) {
// 					await webhookClient.send({
// 						content: `🎉 Happy Birthday ${userMention(user.userId)}! 🎉`,
// 					});
// 				}
// 			} catch (error) {
// 				console.error("Error sending birthday announcement:", error);
// 			}
// 		}
// 	} catch (error) {
// 		console.error("Error during birthday announcement task:", error);
// 	}
// });

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
