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

function redirectToBannerCreator(req, res) {
  const queryIndex = req.originalUrl.indexOf("?");
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
  res.redirect(301, `/windshield-banner-creator${query}`);
}

function redirectToCart(req, res) {
  const queryIndex = req.originalUrl.indexOf("?");
  const query = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
  res.redirect(301, `/cart${query}`);
}

router.get("/", serveIndex);
router.get("/robots.txt", serveRobotsTxt);
router.get("/sitemap.xml", serveSitemapXml);

router.get("/tools", serveToolsIndex);
router.get(`/tools/:tool(${toolPattern})`, serveToolPage);

router.get("/mustang-customizer", redirectToBannerCreator);
router.get("/mustang-customizer.html", redirectToBannerCreator);
router.get("/windshield-banner-creator.html", redirectToBannerCreator);
router.get("/cart.html", redirectToCart);

router.get("/checkout", serveCheckout);
router.get("/cart", serveCart);
router.get("/order-success", serveOrderSuccess);

router.get(`/:page(${pagePattern})`, servePage);

module.exports = router;