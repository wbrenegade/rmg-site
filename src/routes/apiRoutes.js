const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { getHealth } = require("../controllers/healthController");
const { listProducts } = require("../controllers/productController");
const { listInstallers } = require("../controllers/installerController");
const { listCategories } = require("../controllers/categoryController");
const { listVehicleCatalog } = require("../controllers/vehicleController");
const { signup, login } = require("../controllers/authController");
const { listOrders, createNewOrder } = require("../controllers/orderController");
const { createNewMessage } = require("../controllers/messageController");
const { createAnalyticsEvent, getCmsAnalyticsSummary } = require("../controllers/analyticsController");
const { sendCmsTestOrderAlert } = require("../controllers/orderAlertController");
const {
	cmsLogin,
	listCmsProducts,
	createCmsProduct,
	updateCmsProduct,
	deleteCmsProduct,
	listCmsOrders,
	markCmsOrderFulfilled,
	listCmsMessages,
	getPublicSettings,
	getCmsSettings,
	updateCmsSettings
} = require("../controllers/cmsController");
const { requireCmsAuth } = require("../middleware/requireCmsAuth");


const router = express.Router();

const uploadDir = path.join(__dirname, "..", "..", "data", "uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
	dest: uploadDir,
	limits: {
		fileSize: 25 * 1024 * 1024,
	},
});

const premadeDecalDir = path.join(__dirname, "..", "..", "public", "assets", "svg");

function titleCaseAssetName(value) {
	return String(value || "")
		.replace(/\.[^.]+$/, "")
		.replace(/[_-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function listPremadeDecalFiles(dir, relativeDir = "") {
	if (!fs.existsSync(dir)) return [];

	return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const relativePath = path.posix.join(relativeDir, entry.name);
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			return listPremadeDecalFiles(fullPath, relativePath);
		}

		if (!/\.(svg|png|jpe?g|webp)$/i.test(entry.name)) return [];

		const category = relativeDir ? titleCaseAssetName(relativeDir.split("/").join(" ")) : "Premade";
		const name = titleCaseAssetName(entry.name);
		const id = relativePath.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
		const assetPath = `/assets/svg/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
		const isSvg = /\.svg$/i.test(entry.name);

		return [{
			id,
			label: `${category} - ${name}`,
			path: assetPath,
			type: isSvg ? "svg" : "image",
			outlined: /outline|outlined/i.test(entry.name)
		}];
	});
}

router.get("/health", getHealth);
router.get("/products", listProducts);
router.get("/premade-decals", (req, res) => {
	res.json(listPremadeDecalFiles(premadeDecalDir).sort((a, b) => a.label.localeCompare(b.label)));
});
router.get("/installers", listInstallers);
router.get("/categories", listCategories);
router.get("/vehicles/catalog", listVehicleCatalog);
router.get("/settings/public", getPublicSettings);
router.post("/analytics/events", createAnalyticsEvent);
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.get("/orders", listOrders);
router.post("/orders", createNewOrder);
router.post("/messages", createNewMessage);

router.post("/cms/login", cmsLogin);
router.get("/cms/products", requireCmsAuth, listCmsProducts);
router.post("/cms/products", requireCmsAuth, createCmsProduct);
router.put("/cms/products/:id", requireCmsAuth, updateCmsProduct);
router.delete("/cms/products/:id", requireCmsAuth, deleteCmsProduct);
router.get("/cms/orders", requireCmsAuth, listCmsOrders);
router.patch("/cms/orders/:id/fulfill", requireCmsAuth, markCmsOrderFulfilled);
router.get("/cms/messages", requireCmsAuth, listCmsMessages);
router.get("/cms/analytics", requireCmsAuth, getCmsAnalyticsSummary);
router.post("/cms/order-alerts/test", requireCmsAuth, sendCmsTestOrderAlert);
router.get("/cms/settings", requireCmsAuth, getCmsSettings);
router.put("/cms/settings", requireCmsAuth, updateCmsSettings);

module.exports = router;
