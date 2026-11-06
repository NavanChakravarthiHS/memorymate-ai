export function requireJson(req, res, next) {
  if (req.method === "GET" || req.method === "HEAD") {
    return next();
  }
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({ error: "Request body must be JSON." });
  }
  next();
}

export function requireTextField(field, { min = 1, max = 8000 } = {}) {
  return (req, res, next) => {
    const value = req.body?.[field];
    if (typeof value !== "string") {
      return res.status(400).json({ error: `${field} must be a string.` });
    }
    const trimmed = value.trim();
    if (trimmed.length < min) {
      return res.status(400).json({ error: `${field} cannot be empty.` });
    }
    if (trimmed.length > max) {
      return res.status(400).json({ error: `${field} is too long.` });
    }
    req.body[field] = trimmed;
    next();
  };
}
