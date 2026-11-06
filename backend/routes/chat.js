import { Router } from "express";
import { chat } from "../controllers/chatController.js";
import { requireTextField } from "../middleware/validate.js";

const router = Router();
router.post("/", requireTextField("message"), chat);
export default router;
