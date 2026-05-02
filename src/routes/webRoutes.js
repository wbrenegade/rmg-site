const express = require("express");

const {
  serveIndex,
  servePage,
  serveToolsIndex,
  serveToolPage,
  serveOrderSuccess,
  serveCheckout,
  serveCart,
  pageRoutes,
  toolRoutes
} = require("../controllers/pageController");
const { serveRobotsTxt, serveSitemapXml } = require("../controllers/seoController");

const router = express.Router();

const pagePattern = pageRoutes.join("|");
const toolPattern = toolRoutes.join("|");
const canonicalPagePath = new Map([
  ["index", "/"],
  ["tools", "/" + "tools"],
  ...pageRoutes.map((page) => [page, `/${page}`])
]);
const canonicalToolPath = new Map(toolRoutes.map((tool) => [tool, `/tools/${tool}`]));

function redirectWithQuery(req, res, targetPath) {
  const queryIndex = req.originalUrl.indexOf("?");
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
  res.redirect(301, `${targetPath}${query}`);
}

function redirectToCanonicalPage(req, res) {
  const key = String(req.params.page || "").toLowerCase();
  const target = canonicalPagePath.get(key);
  if (!target) {
    res.status(404).end();
    return;
  }

  redirectWithQuery(req, res, target);
}

function redirectToCanonicalTool(req, res) {
  const key = String(req.params.tool || "").toLowerCase();
  const target = canonicalToolPath.get(key);
  if (!target) {
    res.status(404).end();
    return;
  }

  redirectWithQuery(req, res, target);
}

router.get("/", serveIndex);
router.get("/robots.txt", serveRobotsTxt);
router.get("/sitemap.xml", serveSitemapXml);

router.get("/tools", serveToolsIndex);
router.get("/tools/decal-preview", (req, res) => redirectWithQuery(req, res, "/customize"));
router.get("/tools/decal-editor", (req, res) => redirectWithQuery(req, res, "/tools/decal-creator"));
router.get("/tools/decal-preview.html", (req, res) => redirectWithQuery(req, res, "/customize"));
router.get("/decal-preview", (req, res) => redirectWithQuery(req, res, "/customize"));
router.get("/decal-preview.html", (req, res) => redirectWithQuery(req, res, "/customize"));
router.get(`/tools/:tool(${toolPattern})`, serveToolPage);
router.get(`/tools/:tool(${toolPattern})\\.html`, redirectToCanonicalTool);
router.get(`/:tool(${toolPattern})\\.html`, redirectToCanonicalTool);

router.get(`/:page(index|tools|${pagePattern})\\.html`, redirectToCanonicalPage);

router.get("/mustang-customizer", (req, res) => redirectWithQuery(req, res, "/windshield-banner-creator"));
router.get("/mustang-customizer.html", (req, res) => redirectWithQuery(req, res, "/windshield-banner-creator"));
router.get("/mustang-decal-mockup-editor", (req, res) => redirectWithQuery(req, res, "/windshield-banner-creator"));
router.get("/mustang-decal-mockup-editor.html", (req, res) => redirectWithQuery(req, res, "/windshield-banner-creator"));

router.get("/checkout", serveCheckout);
router.get("/cart", serveCart);
router.get("/order-success", serveOrderSuccess);

router.get(`/:page(${pagePattern})`, servePage);

module.exports = router;
