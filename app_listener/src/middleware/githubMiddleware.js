import process from "node:process";
import { Webhooks } from "@octokit/webhooks";
import createHttpError from "http-errors";

const webhooks = new Webhooks({
	secret: process.env.GITHUB_SECRET,
});

export default async function githubMiddleware(req, res, next) {
	const signature = req.headers["x-hub-signature-256"];
	const body = req.body;

	try {
		const result = await webhooks.verify(body, signature);
		if (!result) {
			return next(createHttpError(401));
		}
	} catch (error) {
		console.error(error);
		return next(error);
	}

	return next();
}
