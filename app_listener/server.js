import "dotenv/config";
import process from "node:process";
import app from "./src/app.js";

const port = process.env.PORT || 3_000;

const server = app.listen(port, () => {
	console.log(`Express server listening on port ${port}`);
});

function shutdown() {
	server.close((err) => {
		if (err) {
			console.error(err);
			process.exit(1);
		} else {
			console.log("HTTP server closed");
			process.exit(0);
		}
	});
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
