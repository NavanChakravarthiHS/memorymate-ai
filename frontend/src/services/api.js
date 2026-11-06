import axios from "axios";
import { getUserId } from "./userStore";

const api = axios.create({
  baseURL: "/api",
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  config.headers["X-User-Id"] = getUserId();
  return config;
});

export function getErrorMessage(error, fallback = "Something went wrong.") {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    (error?.response ? `Request failed (${error.response.status}).` : error?.message) ||
    fallback
  );
}

export async function sendChat({ message, history }) {
  const { data } = await api.post("/chat", { message, history });
  return data;
}

export async function fetchMemories() {
  const { data } = await api.get("/memories");
  return data;
}

export async function searchMemories(query) {
  const { data } = await api.post("/memories/search", { query });
  return data;
}

export async function reflectMemories(query) {
  const { data } = await api.post("/memories/reflect", query ? { query } : {});
  return data;
}

export async function fetchHealth() {
  const { data } = await api.get("/health");
  return data;
}

export default api;
