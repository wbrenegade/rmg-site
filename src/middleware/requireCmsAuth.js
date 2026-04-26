const activeCmsTokens = new Map();
const tokenTtlMs = 1000 * 60 * 60 * 8;

function createCmsToken() {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  activeCmsTokens.set(token, Date.now() + tokenTtlMs);
  return token;
}

function requireCmsAuth(req, res, next) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expiresAt = activeCmsTokens.get(token);

  if (!token || !expiresAt) {
    res.status(401).json({ error: "Unauthorized CMS request." });
    return;
  }

  if (expiresAt < Date.now()) {
    activeCmsTokens.delete(token);
    res.status(401).json({ error: "CMS session expired. Please log in again." });
    return;
  }

  activeCmsTokens.set(token, Date.now() + tokenTtlMs);
  next();
}

module.exports = {
  createCmsToken,
  requireCmsAuth
};
