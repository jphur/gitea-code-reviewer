import express, { Router } from "express";
import { review } from "../core/review";
import { validateReviewRequest } from "./middlewares";

const router: Router = express.Router();

router.post("/review", validateReviewRequest, review);

export default router;
