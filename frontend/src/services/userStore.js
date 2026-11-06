const USER_KEY = "memorymate.userId";
const DEFAULT_USER = "demo-user";

export function getUserId() {
  return localStorage.getItem(USER_KEY) || DEFAULT_USER;
}

export function setUserId(userId) {
  const next = String(userId || DEFAULT_USER)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .slice(0, 48) || DEFAULT_USER;
  localStorage.setItem(USER_KEY, next);
  return next;
}
