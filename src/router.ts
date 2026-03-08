import express, { Router } from "express";
import { review } from "./actions/review/action";

const router: Router = express.Router();

router.post("/review", review);

export default router;
