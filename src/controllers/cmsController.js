const {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById
} = require("../models/productModel");
const { getAllOrders, markOrderFulfilled } = require("../models/orderModel");
const { getAllMessages } = require("../models/messageModel");
const { getSiteSettings, updateSiteSettings } = require("../models/siteSettingsModel");
const { createCmsToken } = require("../middleware/requireCmsAuth");

function cmsLogin(req, res) {
  const { password } = req.body || {};
  const expectedPassword = process.env.CMS_PASSWORD || "changeme123";

  if (!password || password !== expectedPassword) {
    res.status(401).json({ error: "Invalid CMS password." });
    return;
  }

  const token = createCmsToken();
  res.json({ token });
}

function listCmsProducts(req, res) {
  res.json(getAllProducts());
}

function createCmsProduct(req, res) {
  const { name, category, subcategory, price } = req.body || {};
  if (!name || !category || !subcategory || Number.isNaN(Number(price))) {
    res.status(400).json({ error: "Name, category, subcategory, and numeric price are required." });
    return;
  }

  try {
    const created = createProduct(req.body);
    res.status(201).json(created);
  } catch (error) {
    res.status(409).json({ error: error.message || "Could not create product." });
  }
}

function updateCmsProduct(req, res) {
  const { id } = req.params;

  if (!getProductById(id)) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  if (req.body.price !== undefined && Number.isNaN(Number(req.body.price))) {
    res.status(400).json({ error: "Price must be numeric." });
    return;
  }

  const updated = updateProduct(id, req.body);
  res.json(updated);
}

function deleteCmsProduct(req, res) {
  const { id } = req.params;
  const deleted = deleteProduct(id);

  if (!deleted) {
    res.status(404).json({ error: "Product not found." });
    return;
  }

  res.status(204).send();
}

function listCmsOrders(req, res) {
  res.json(getAllOrders());
}

function markCmsOrderFulfilled(req, res) {
  const { id } = req.params;
  const updated = markOrderFulfilled(id);

  if (!updated) {
    res.status(404).json({ error: "Order not found." });
    return;
  }

  res.json(updated);
}

function listCmsMessages(req, res) {
  res.json(getAllMessages());
}

function getPublicSettings(req, res) {
  const settings = getSiteSettings();
  res.json({
    homeEyebrow: settings.homeEyebrow,
    homeTitle: settings.homeTitle,
    homePhrase: settings.homePhrase
  });
}

function getCmsSettings(req, res) {
  res.json(getSiteSettings());
}

function updateCmsSettings(req, res) {
  const next = updateSiteSettings(req.body || {});
  res.json(next);
}

module.exports = {
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
};
