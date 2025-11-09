import { EmbedBuilder } from "@discordjs/builders";
import axios from "axios";
import * as cheerio from "cheerio";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600, maxKeys: 1 }); // Remove after 10 minutes

async function getLatestArticle() {
	if (cache.has("article")) {
		return cache.get("article");
	}

	const response = await axios.get("https://www.newsmax.com/politics/");
	const $ = cheerio.load(response.data);

	const article = {
		title: $(".article_link > .article_link_bold").first().text().trim(),
		description: $(".article_link > #copy_small").first().text().trim(),
		image: `https://www.newsmax.com${$(".article_link > img").first().attr("src")}`,
		url: `https://www.newsmax.com${$(".article_link > .article_link_bold").first().attr("href")}`,
	};

	try {
		const extendedInfo = await getExtendedArticleInfo(article.url);
		cache.set("article", {
			...article,
			...extendedInfo,
		});
	} catch (error) {
		console.error(error);
		cache.set("article", article);
	}

	return cache.get("article");
}

async function getExtendedArticleInfo(url) {
	const response = await axios.get(url);
	const $ = cheerio.load(response.data);

	return {
		author: $('span[itemprop="author"]').first().text().trim(),
		date: Date.parse($(".artPgDate").first().text().trim()),
	};
}

/** @type {import('./index.js').Command} */
export default {
	data: {
		name: "newsmax",
		description: "Fetch the latest breaking news story from Newsmax",
	},
	async execute(interaction) {
		await interaction.deferReply();

		try {
			const article = await getLatestArticle();

			await interaction.editReply({
				embeds: [
					new EmbedBuilder()
						.setTitle(article.title)
						.setURL(article.url)
						.setAuthor({ name: article.author || "Newsmax" })
						.setDescription(article.description)
						.setThumbnail(article.image)
						.setTimestamp(article.date)
						.setFooter({
							text: "Newsmax",
							iconURL:
								"https://yt3.googleusercontent.com/xjxmYwEWSbA78QQKTTtAOlbiGWqT3F1yGl1WoGDy0YXruTrtde9LtrJ_zqo9MPvWVJ8REyD_Qg=s900-c-k-c0x00ffffff-no-rj",
						}),
				],
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({ content: "Failure fetching the latest news story!" });
		}
	},
};
