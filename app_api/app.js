import cors from "cors";
import express from "express";
import createHttpError from "http-errors";
import logger from "morgan";

const port = process.env.PORT || 3_000;
const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.get("/", (req, res) => {
	res.status(200).json({ message: "Hello World!" });
});

app.use((req, res, next) => {
	next(createHttpError(404)); // Not Found
});

app.use((err, req, res, _next) => {
	res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

const server = app.listen(port, () => {
	console.log(`Express server running on port ${port}`);
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
