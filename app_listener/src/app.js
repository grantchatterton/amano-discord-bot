import cors from "cors";
import express from "express";
import createHttpError from "http-errors";
import logger from "morgan";
import indexRouter from "./routes/indexRouter.js";

const app = express();

app.use(logger("dev"));
app.use(express.text());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use("/", indexRouter);

app.use((req, res, next) => {
	next(createHttpError(404)); // Not Found
});

app.use((err, req, res, next) => {
	res.status(err.status || 500).json({ message: err.message || "Internal Server Error" });
});

export default app;
