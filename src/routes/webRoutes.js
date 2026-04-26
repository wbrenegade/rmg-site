const express = require("express");
const {
	serveIndex,
	servePage,
	serveToolsIndex,
	serveToolPage,
	pageRoutes,
	toolRoutes
} = require("../controllers/pageController");

const router = express.Router();

router.get("/", serveIndex);
router.get("/tools", serveToolsIndex);
router.get(`/tools/:tool(${toolRoutes.join("|")})`, serveToolPage);
router.get(`/:page(${pageRoutes.join("|")})`, servePage);

module.exports = router;
