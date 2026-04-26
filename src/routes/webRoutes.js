const express = require("express");
const { serveIndex, servePage, pageRoutes } = require("../controllers/pageController");

const router = express.Router();

router.get("/", serveIndex);
router.get(`/:page(${pageRoutes.join("|")})`, servePage);

module.exports = router;
