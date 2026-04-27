const { getAllProducts } = require("../models/productModel");
const { pageRoutes, toolRoutes } = require("./pageController");

function getBaseSiteUrl(req) {
  const explicit = String(process.env.SITE_URL || "").trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

function absoluteUrl(baseUrl, pathname) {
  if (pathname === "/") {
    return `${baseUrl}/`;
  }
  return `${baseUrl}${pathname}`;
}

function buildCrawlablePaths() {
  const excludedPages = new Set(["admin", "login", "signup", "account", "cart", "checkout", "order-success"]);
  const generalPages = pageRoutes
    .filter((page) => !excludedPages.has(page))
    .map((page) => `/${page}`);

  const toolsIndex = ["/tools"];
  const toolPages = toolRoutes.map((tool) => `/tools/${tool}`);

  const productUrls = getAllProducts().map((product) => {
    const slug = encodeURIComponent(product.slug || product.id || "");
    return slug ? `/product?slug=${slug}` : "/product";
  });

  return ["/", ...generalPages, ...toolsIndex, ...toolPages, "/shop", ...productUrls];
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function serveRobotsTxt(req, res) {
  const baseUrl = getBaseSiteUrl(req);

  const content = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "Disallow: /cart",
    "Disallow: /checkout",
    "Disallow: /account",
    "Disallow: /login",
    "Disallow: /signup",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    ""
  ].join("\n");

  res.type("text/plain").send(content);
}

function serveSitemapXml(req, res) {
  const baseUrl = getBaseSiteUrl(req);
  const now = new Date().toISOString();
  const paths = [...new Set(buildCrawlablePaths())];

  const urlEntries = paths.map((path) => {
    const isHome = path === "/";
    const isShop = path === "/shop";

    return [
      "  <url>",
      `    <loc>${escapeXml(absoluteUrl(baseUrl, path))}</loc>`,
      `    <lastmod>${now}</lastmod>`,
      `    <changefreq>${isHome ? "daily" : isShop ? "daily" : "weekly"}</changefreq>`,
      `    <priority>${isHome ? "1.0" : isShop ? "0.9" : "0.7"}</priority>`,
      "  </url>"
    ].join("\n");
  });

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    "</urlset>",
    ""
  ].join("\n");

  res.type("application/xml").send(xml);
}

module.exports = {
  serveRobotsTxt,
  serveSitemapXml,
  getBaseSiteUrl
};
