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

router.get("/health", getHealth);
router.get("/products", listProducts);
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
