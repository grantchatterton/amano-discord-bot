import process from "node:process";
import OpenAI from "openai";

export const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
