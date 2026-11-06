import {
  listStoredMemories,
  recallMemories,
  reflectOnMemories,
} from "../services/hindsightService.js";

export async function listMemories(req, res, next, services = {}) {
  const list = services.listStoredMemories || listStoredMemories;
  try {
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const offset = Number(req.query.offset) || 0;
    const result = await list(req.user.bankId, { limit, offset });
    res.json({
      bankId: req.user.bankId,
      total: result.total,
      items: result.items,
    });
  } catch (err) {
    next(err);
  }
}

export async function searchMemories(req, res, next, services = {}) {
  const recall = services.recallMemories || recallMemories;
  try {
    const { query } = req.body;
    const result = await recall(req.user.bankId, query);
    res.json({
      bankId: req.user.bankId,
      query,
      memories: result.results,
    });
  } catch (err) {
    next(err);
  }
}

export async function reflectMemories(req, res, next, services = {}) {
  const reflect = services.reflectOnMemories || reflectOnMemories;
  try {
    const query =
      req.body.query ||
      "Generate a personal profile summary from stored memories. Include name if known, skills, interests, learning goals, preferences, and important facts. If something is unknown, say it is not stored yet.";

    const result = await reflect(req.user.bankId, query, {
      context: "MemoryMate Memory Dashboard profile generation",
      budget: "mid",
    });

    res.json({
      bankId: req.user.bankId,
      query,
      summary: result.text,
      basedOn: result.basedOn,
      usage: result.usage,
    });
  } catch (err) {
    next(err);
  }
}
