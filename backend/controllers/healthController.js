import { env, groqConfigured, hindsightConfigured } from "../config/env.js";
import { pingHindsight } from "../services/hindsightService.js";

export async function health(_req, res, next) {
  try {
    const hindsight = await pingHindsight();
    res.json({
      ok: true,
      service: "memorymate-ai",
      groq: {
        configured: groqConfigured(),
        model: env.groqModel,
      },
      hindsight: {
        configured: hindsightConfigured() && Boolean(env.hindsightApiKey || !env.hindsightBaseUrl.includes("vectorize.io")),
        baseUrl: env.hindsightBaseUrl,
        ...hindsight,
      },
    });
  } catch (err) {
    next(err);
  }
}
