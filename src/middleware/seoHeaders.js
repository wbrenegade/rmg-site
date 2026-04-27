const { getBaseSiteUrl } = require("../controllers/seoController");

const noIndexPaths = new Set([
  "/admin",
  "/login",
  "/signup",
  "/account",
  "/cart",
  "/checkout",
  "/order-success"
]);

function hasFileExtension(pathname) {
  return /\.[a-z0-9]+$/i.test(pathname || "");
}

function shouldApplySeoHeaders(req) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return false;
  }

  if (req.path.startsWith("/api")) {
    return false;
  }

  if (hasFileExtension(req.path)) {
    return false;
  }

  const accept = String(req.headers.accept || "");
  return accept.includes("text/html") || accept.includes("*/*");
}

function setSeoHeaders(req, res, next) {
  if (!shouldApplySeoHeaders(req)) {
    next();
    return;
  }

  const baseUrl = getBaseSiteUrl(req);
  const canonicalPath = req.path === "/" ? "/" : req.path.replace(/\/$/, "");
  const canonicalUrl = canonicalPath === "/" ? `${baseUrl}/` : `${baseUrl}${canonicalPath}`;

  res.setHeader("Link", `<${canonicalUrl}>; rel="canonical"`);
  if (noIndexPaths.has(canonicalPath)) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
  } else {
    res.setHeader("X-Robots-Tag", "index, follow");
  }

  next();
}

module.exports = {
  setSeoHeaders
};
