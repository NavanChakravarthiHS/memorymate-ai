export function notFound(_req, res) {
  res.status(404).json({ error: "Route not found." });
}

function redactSecrets(text) {
  return String(text || "")
    .replace(/gsk_[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]")
    .replace(/hsk_[A-Za-z0-9_]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]");
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = redactSecrets(
    err.publicMessage ||
      (typeof err.message === "string" ? err.message : "Unexpected server error.")
  );

  console.error("[MemoryMate]", err.code || "ERROR", status, redactSecrets(err.message || ""));

  res.status(status).json({
    error: message,
    code: err.code || "INTERNAL_ERROR",
  });
}
