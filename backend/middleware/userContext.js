import { env } from "../config/env.js";

export function sanitizeUserId(raw) {
  const value = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

  return value || env.demoUserId;
}

export function bankIdForUser(userId) {
  return `memorymate-${sanitizeUserId(userId)}`;
}

export function userContext(req, _res, next) {
  const userId = sanitizeUserId(req.header("x-user-id") || env.demoUserId);
  req.user = {
    id: userId,
    bankId: bankIdForUser(userId),
  };
  next();
}
