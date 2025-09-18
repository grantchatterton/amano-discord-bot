import express from "express";
import apiController from "../controllers/apiController.js";
import githubMiddleware from "../middleware/githubMiddleware.js";

const router = express.Router();
router.post("/v1/github", githubMiddleware, apiController.githubHandler);

export default router;
