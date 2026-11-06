import { Router } from "express";
import {
  listMemories,
  reflectMemories,
  searchMemories,
} from "../controllers/memoryController.js";
import { requireTextField } from "../middleware/validate.js";

const router = Router();
router.get("/", listMemories);
router.post("/search", requireTextField("query"), searchMemories);
router.post("/reflect", reflectMemories);
export default router;
