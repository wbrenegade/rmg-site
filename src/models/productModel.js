const { readDb, writeDb } = require("./dbModel");

function normalizeProductId(name, explicitId) {
  const base = String(explicitId || name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `product-${Date.now()}`;
}

function normalizeSlug(value, fallback) {
  const base = String(value || fallback || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || `product-${Date.now()}`;
}

function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return Boolean(fallback);
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return Boolean(value);
}

function normalizeSubSubcategory(value, fallback = null) {
  const raw = value !== undefined ? value : fallback;
  if (raw === null || raw === undefined) return null;
  const text = String(raw).trim();
  return text ? text : null;
}

function normalizeTags(value, category, subcategory, subSubcategory, fallback = []) {
  let source = value;

  if (source === undefined) {
    source = fallback;
  }

  let tags = [];
  if (Array.isArray(source)) {
    tags = source;
  } else if (typeof source === "string") {
    tags = source.split(",");
  }

  const normalized = tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean);

  if (normalized.length) {
    return [...new Set(normalized)];
  }

  return [category, subcategory, subSubcategory]
    .filter((tag) => typeof tag === "string" && tag.trim())
    .map((tag) => tag.trim());
}

function getAllProducts() {
  const db = readDb();
  return db.products;
}

function getProductById(id) {
  return getAllProducts().find((product) => product.id === id) || null;
}

function createProduct(payload) {
  const db = readDb();
  const id = normalizeProductId(payload.name, payload.id);
  const name = String(payload.name || "").trim();
  const category = String(payload.category || "").trim();
  const subcategory = String(payload.subcategory || "").trim();
  const subSubcategory = normalizeSubSubcategory(payload.subSubcategory);

  const nextProduct = {
    id,
    name,
    slug: normalizeSlug(payload.slug, name || id),
    category,
    subcategory,
    subSubcategory,
    price: Number(payload.price),
    tags: normalizeTags(payload.tags, category, subcategory, subSubcategory),
    imagePath: payload.imagePath || "/assets/imgs/main.PNG",
    imageLabel: payload.imageLabel || "Product Preview",
    description: payload.description || "",
    featured: normalizeBoolean(payload.featured),
    custom: normalizeBoolean(payload.custom)
  };

  if (db.products.some((product) => product.id === nextProduct.id)) {
    throw new Error("A product with that id already exists.");
  }

  db.products.push(nextProduct);
  writeDb(db);
  return nextProduct;
}

function updateProduct(id, payload) {
  const db = readDb();
  const target = db.products.find((product) => product.id === id);

  if (!target) return null;

  target.name = payload.name ?? target.name;
  target.slug = payload.slug !== undefined
    ? normalizeSlug(payload.slug, payload.name ?? target.name)
    : normalizeSlug(target.slug, target.name);
  target.category = payload.category ?? target.category;
  target.subcategory = payload.subcategory ?? target.subcategory;
  target.subSubcategory = payload.subSubcategory !== undefined
    ? normalizeSubSubcategory(payload.subSubcategory, target.subSubcategory)
    : normalizeSubSubcategory(target.subSubcategory);
  target.price = payload.price !== undefined ? Number(payload.price) : target.price;
  target.tags = normalizeTags(
    payload.tags,
    target.category,
    target.subcategory,
    target.subSubcategory,
    Array.isArray(target.tags) ? target.tags : []
  );
  target.featured = payload.featured !== undefined ? normalizeBoolean(payload.featured) : normalizeBoolean(target.featured);
  target.custom = payload.custom !== undefined ? normalizeBoolean(payload.custom) : normalizeBoolean(target.custom);
  target.description = payload.description ?? target.description;
  target.imagePath = payload.imagePath ?? target.imagePath;
  target.imageLabel = payload.imageLabel ?? target.imageLabel;

  writeDb(db);
  return target;
}

function deleteProduct(id) {
  const db = readDb();
  const index = db.products.findIndex((product) => product.id === id);

  if (index < 0) return false;

  db.products.splice(index, 1);
  writeDb(db);
  return true;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
