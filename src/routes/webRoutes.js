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

const router = express.Router();

const pagePattern = pageRoutes.join("|");
const toolPattern = toolRoutes.join("|");

router.get("/", serveIndex);

router.get("/tools", serveToolsIndex);
router.get(`/tools/:tool(${toolPattern})`, serveToolPage);

router.get("/checkout", serveCheckout);
router.get("/cart", serveCart);
router.get("/order-success", serveOrderSuccess);

router.get(`/:page(${pagePattern})`, servePage);

module.exports = router;