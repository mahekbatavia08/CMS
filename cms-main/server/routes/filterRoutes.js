import express from "express";

import protect from "../middlewares/authMiddleware.js";
import { getFilterSuggestions } from "../controllers/filterController.js";

const router = express.Router();

router.get("/", protect, getFilterSuggestions);

export default router;