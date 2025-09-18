import { launchAmanoApp } from "../util/util.js";

export async function githubHandler(req, res, next) {
	try {
		const launchResult = await launchAmanoApp();
		if (launchResult) {
			return next(launchResult);
		}
	} catch (error) {
		console.error(error);
		return next(error);
	}

	res.status(200).json({ message: "OK" });
}

export default {
	githubHandler,
};
