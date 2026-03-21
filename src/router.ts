import express, { Router } from "express";
import { review } from "./review";

const router: Router = express.Router();

router.post("/review", review);

export default router;
