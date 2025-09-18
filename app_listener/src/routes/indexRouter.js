import express from "express";
import apiRouter from "./apiRouter.js";

const router = express.Router();
router.use("/api", apiRouter);

export default router;
