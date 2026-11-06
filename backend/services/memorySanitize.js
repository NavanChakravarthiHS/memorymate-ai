const CREDENTIAL_PATTERNS = [
  /\b(api[_-]?key|password|passwd)\s*[:=]\s*\S+/i,
  /\b(api[_-]?key|password|passwd)\s+is\s+\S+/i,
  /\bsecret\s*[:=]\s*\S+/i,
  /bearer\s+[a-z0-9._\-]+/i,
  /\bgsk_[a-z0-9_-]{10,}/i,
  /\bhsk_[a-z0-9_]{10,}/i,
  /\bsk-[a-z0-9]{10,}/i,
  /-----BEGIN [A-Z ]+PRIVATE KEY-----/i,
  /\b(ssn|social security(?: number)?)\b.{0,16}\d{3}[-\s]?\d{2}[-\s]?\d{4}/i,
  /\bcredit\s*card\b.{0,24}\d{12,}/i,
];

const SKIP_MESSAGES = new Set([
  "hi",
  "hello",
  "hey",
  "thanks",
  "thank you",
  "ok",
  "okay",
  "yes",
  "no",
  "yo",
]);

export function looksSensitive(text) {
  const value = String(text || "");
  return CREDENTIAL_PATTERNS.some((pattern) => pattern.test(value));
}

export function shouldRetain(text) {
  const trimmed = String(text || "").trim();
  if (trimmed.length < 8) return false;
  if (SKIP_MESSAGES.has(trimmed.toLowerCase())) return false;
  if (looksSensitive(trimmed)) return false;
  return true;
}

export function retainSkipReason(text) {
  const trimmed = String(text || "").trim();
  if (looksSensitive(trimmed)) {
    return "Message looked like a credential or secret value and was not stored.";
  }
  if (trimmed.length < 8 || SKIP_MESSAGES.has(trimmed.toLowerCase())) {
    return "Short greeting or low-value message was not stored as long-term memory.";
  }
  return null;
}
