import process from "node:process";
import createHttpError from "http-errors";
import { verifySignature } from "../util/util.js";

export default async function githubMiddleware(req, res, next) {
	const secret = process.env.GITHUB_SECRET;
	const header = req.headers["x-hub-signature-256"];
	const payload = req.body;

	if (!header) {
		return next(createHttpError(401, "Unauthorized: X-Hub-Signature-256 header missing!"));
	}

	try {
		const result = await verifySignature(secret, header, payload);
		if (!result) {
			return next(createHttpError(401));
		}
	} catch (error) {
		console.error(error);
		return next(error);
	}

	return next();
}
