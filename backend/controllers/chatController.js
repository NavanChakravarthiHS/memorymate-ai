import { generateAssistantReply } from "../services/groqService.js";
import {
  listStoredMemories,
  recallMemories,
  retainMemory,
} from "../services/hindsightService.js";
import { retainSkipReason, shouldRetain } from "../services/memorySanitize.js";

export async function chat(req, res, next, services = {}) {
  const generate = services.generateAssistantReply || generateAssistantReply;
  const recall = services.recallMemories || recallMemories;
  const retain = services.retainMemory || retainMemory;
  const listMemories = services.listStoredMemories || listStoredMemories;

  try {
    const { message, history = [] } = req.body;
    const { bankId, id: userId } = req.user;

    let memories = [];
    let recalled = false;
    let recallError = null;

    try {
      const recalledResult = await recall(bankId, message);
      memories = recalledResult.results;
      recalled = true;
    } catch (err) {
      recallError = err.publicMessage || err.message;
    }

    const generation = await generate({
      message,
      history: Array.isArray(history) ? history : [],
      memories,
      bankId,
      userId,
    });
    const reply = generation.reply;
    const toolCallCount = generation.toolCallCount || 0;

    let retained = false;
    let retainError = null;
    let skipReason = retainSkipReason(message);

    if (shouldRetain(message)) {
      try {
        await retain(bankId, message, {
          context: "User message in MemoryMate chat",
          metadata: {
            source: "chat",
            userId,
          },
          tags: ["conversation", "user"],
        });
        retained = true;
        skipReason = null;
      } catch (err) {
        retainError = err.publicMessage || err.message;
      }
    }

    let memoryCount = null;
    try {
      const listed = await listMemories(bankId, { limit: 1 });
      memoryCount = listed.total;
    } catch {
      memoryCount = null;
    }

    res.json({
      reply,
      memories,
      toolCallCount,
      memoryStatus: {
        bankId,
        recalled,
        retained,
        recallError,
        retainError,
        skipReason,
        memoryCount,
        toolCallCount,
      },
    });
  } catch (err) {
    next(err);
  }
}
