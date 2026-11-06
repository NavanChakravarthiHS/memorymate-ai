import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnv = path.resolve(__dirname, "../../.env");
const localEnv = path.resolve(__dirname, "../.env");

dotenv.config({ path: rootEnv });
dotenv.config({ path: localEnv, override: false });

function read(name, fallback = "") {
  return (process.env[name] || fallback).trim();
}

export const env = {
  nodeEnv: read("NODE_ENV", "development"),
  port: Number(read("PORT", "5000")),
  corsOrigin: read("CORS_ORIGIN", "http://localhost:5173"),
  groqApiKey: read("GROQ_API_KEY"),
  groqModel: read("GROQ_MODEL", "openai/gpt-oss-120b"),
  hindsightApiKey: read("HINDSIGHT_API_KEY"),
  hindsightBaseUrl: read("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io"),
  demoUserId: read("DEMO_USER_ID", "demo-user"),
};

export function groqConfigured() {
  return Boolean(env.groqApiKey);
}

export function hindsightConfigured() {
  return Boolean(env.hindsightBaseUrl);
}
