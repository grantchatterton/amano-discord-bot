import { readFile, writeFile } from "node:fs/promises";
import { URL } from "node:url";
import { getMarkdownTable } from "markdown-table-ts";
import { loadCommands } from "./loaders.js";

// Load all commands
const commands = await loadCommands(new URL("../commands/", import.meta.url));

// Generate markdown table for commands
const markdown = getMarkdownTable({
	table: {
		head: ["Name", "Description"],
		body: [...commands.values()].map((cmd) => [`/${cmd.data.name}`, cmd.data.description || "No description provided"]),
	},
});

// Load the README file and insert the commands table
const readmeFileURL = new URL("../../README.md", import.meta.url);
const contents = await readFile(readmeFileURL, "utf8");
const updatedContents = contents.replace(
	/<!-- BEGIN COMMANDS SECTION -->[\S\s]*?<!-- END COMMANDS SECTION -->/,
	`<!-- BEGIN COMMANDS SECTION -->\n\n${markdown}\n\n<!-- END COMMANDS SECTION -->`,
);
await writeFile(readmeFileURL, updatedContents, "utf8");

console.log("Updated README.md with command documentation.");
