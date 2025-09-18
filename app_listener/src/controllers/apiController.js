import { launchApp } from "../util/util.js";

export async function githubHandler(req, res, next) {
	try {
		const launchResult = await launchApp();
		if (launchResult) {
			return next(launchResult);
		}
	} catch (error) {
		console.error(error);
		return next(error);
	}

	return res.status(200).json({ message: "OK" });
}

export default {
	githubHandler,
};
