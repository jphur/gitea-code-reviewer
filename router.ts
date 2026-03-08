import express from "express";
import { review } from "./actions/review/action.ts";

const router = express.Router();

router.post("/review", review);

export default router;
