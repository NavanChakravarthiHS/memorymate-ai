import { HindsightClient } from "@vectorize-io/hindsight-client";
import { env, hindsightConfigured } from "../config/env.js";

let client = null;
const preparedBanks = new Set();

function missingConfigError() {
  const error = new Error(
    "Hindsight is not configured. Set HINDSIGHT_BASE_URL and HINDSIGHT_API_KEY in the backend .env file."
  );
  error.status = 503;
  error.code = "HINDSIGHT_NOT_CONFIGURED";
  error.publicMessage = error.message;
  return error;
}

function wrapHindsightError(operation, err) {
  const status = err.statusCode || err.status || 502;
  const message = err.message || "Hindsight request failed.";
  const error = new Error(`${operation} failed: ${message}`);
  error.status = status >= 400 && status < 600 ? status : 502;
  error.code = "HINDSIGHT_ERROR";
  error.cause = err;

  if (status === 401 || status === 403) {
    error.publicMessage = "Hindsight rejected the API key. Check HINDSIGHT_API_KEY.";
    error.status = 401;
  } else if (status === 402) {
    error.publicMessage = "Hindsight reported insufficient credits.";
  } else if (status === 404) {
    error.publicMessage = "Hindsight memory bank was not found.";
  } else {
    error.publicMessage = `Hindsight ${operation} is unavailable right now.`;
  }

  return error;
}

export function getHindsightClient() {
  if (!hindsightConfigured()) {
    throw missingConfigError();
  }
  if (!env.hindsightApiKey && env.hindsightBaseUrl.includes("api.hindsight.vectorize.io")) {
    throw missingConfigError();
  }
  if (!client) {
    client = new HindsightClient({
      baseUrl: env.hindsightBaseUrl.replace(/\/$/, ""),
      apiKey: env.hindsightApiKey || undefined,
    });
  }
  return client;
}

export async function pingHindsight() {
  if (!hindsightConfigured()) {
    return { ok: false, reason: "Hindsight base URL is missing." };
  }
  if (!env.hindsightApiKey && env.hindsightBaseUrl.includes("api.hindsight.vectorize.io")) {
    return { ok: false, reason: "HINDSIGHT_API_KEY is missing for Hindsight Cloud." };
  }
  try {
    const version = await getHindsightClient().getVersion();
    return {
      ok: true,
      apiVersion: version?.api_version || version?.apiVersion || null,
      features: version?.features || null,
    };
  } catch (err) {
    return { ok: false, reason: err.message || "Could not reach Hindsight." };
  }
}

export async function ensureBank(bankId) {
  const hindsight = getHindsightClient();
  if (preparedBanks.has(bankId)) {
    return { bankId, created: false, cached: true };
  }

  try {
    await hindsight.createBank(bankId, {
      name: "MemoryMate AI",
      reflectMission:
        "You are MemoryMate, a personal memory assistant. Summarize only facts that were actually stored. Do not invent personal details. Highlight skills, interests, learning goals, preferences, and important plans.",
      retainMission:
        "Extract durable personal facts: name, education, skills, career goals, interests, preferences, important plans, problems and solutions. Ignore greetings, secrets, passwords, and API keys.",
      disposition: {
        skepticism: 3,
        literalism: 3,
        empathy: 4,
      },
    });
    preparedBanks.add(bankId);
    return { bankId, created: true, cached: false };
  } catch (err) {
    const status = err.statusCode || err.status;
    if (status === 409) {
      preparedBanks.add(bankId);
      return { bankId, created: false, cached: false };
    }
    throw wrapHindsightError("createBank", err);
  }
}

export function normalizeRecallResult(item) {
  if (!item) return null;
  if (typeof item === "string") {
    return { text: item, type: "world" };
  }
  const text = item.text || item.content || item.fact || "";
  if (!text) return null;
  return {
    id: item.id || item.memory_id || null,
    text,
    type: item.type || "world",
    score: item.score ?? item.final_score ?? null,
  };
}

export function normalizeListedMemory(item) {
  if (!item) return null;
  if (typeof item === "string") {
    return { text: item };
  }
  const text = item.text || item.content || item.fact || item.memory || "";
  return {
    id: item.id || item.memory_id || null,
    text: text || JSON.stringify(item),
    type: item.type || item.fact_type || null,
    createdAt: item.mentioned_at || item.created_at || item.date || item.timestamp || null,
    tags: item.tags || [],
  };
}

export async function retainMemory(bankId, content, options = {}) {
  try {
    await ensureBank(bankId);
    const result = await getHindsightClient().retain(bankId, content, {
      timestamp: options.timestamp || new Date(),
      context: options.context || "MemoryMate conversation",
      metadata: options.metadata || { source: "chat" },
      tags: options.tags || ["conversation"],
    });
    return result;
  } catch (err) {
    if (err.code === "HINDSIGHT_NOT_CONFIGURED" || err.code === "HINDSIGHT_ERROR") {
      throw err;
    }
    throw wrapHindsightError("retain", err);
  }
}

export async function recallMemories(bankId, query, options = {}) {
  try {
    await ensureBank(bankId);
    const response = await getHindsightClient().recall(bankId, query, {
      budget: options.budget || "mid",
      maxTokens: options.maxTokens || 2048,
    });
    const results = Array.isArray(response?.results)
      ? response.results.map(normalizeRecallResult).filter(Boolean)
      : [];
    return { results, raw: response };
  } catch (err) {
    if (err.code === "HINDSIGHT_NOT_CONFIGURED" || err.code === "HINDSIGHT_ERROR") {
      throw err;
    }
    throw wrapHindsightError("recall", err);
  }
}

export async function reflectOnMemories(bankId, query, options = {}) {
  try {
    await ensureBank(bankId);
    const response = await getHindsightClient().reflect(bankId, query, {
      budget: options.budget || "mid",
      context: options.context,
      includeFacts: true,
    });
    return {
      text: response?.text || "",
      basedOn: response?.based_on || response?.basedOn || [],
      usage: response?.usage || null,
    };
  } catch (err) {
    if (err.code === "HINDSIGHT_NOT_CONFIGURED" || err.code === "HINDSIGHT_ERROR") {
      throw err;
    }
    throw wrapHindsightError("reflect", err);
  }
}

export async function listStoredMemories(bankId, options = {}) {
  try {
    await ensureBank(bankId);
    const response = await getHindsightClient().listMemories(bankId, {
      limit: options.limit || 50,
      offset: options.offset || 0,
      q: options.q,
      type: options.type,
    });
    const items = Array.isArray(response?.items)
      ? response.items
      : Array.isArray(response?.memories)
        ? response.memories
        : Array.isArray(response)
          ? response
          : [];
    return {
      total: response?.total ?? items.length,
      items: items.map(normalizeListedMemory).filter(Boolean),
    };
  } catch (err) {
    if (err.code === "HINDSIGHT_NOT_CONFIGURED" || err.code === "HINDSIGHT_ERROR") {
      throw err;
    }
    throw wrapHindsightError("listMemories", err);
  }
}
