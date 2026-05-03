const fs = require("fs");
const path = require("path");
const { readDb } = require("./dbModel");

const rootDir = path.join(__dirname, "..", "..");
const dataDir = path.join(rootDir, "data");
const productsFilePath = path.join(dataDir, "products.json");

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

function titleCaseCategory(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "decals") return "Decals";
  if (normalized === "lettering") return "Lettering";
  if (normalized === "wraps") return "Wraps";
  if (normalized === "film kits") return "Film Kits";

  return String(value || "")
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeRawProduct(product = {}, index = 0) {
  const id = normalizeProductId(product.name, product.id || `product-${index + 1}`);
  const name = String(product.name || "Untitled Product").trim();
  const rawCategory = String(product.category || "decals").trim().toLowerCase() || "decals";
  const isDecal = rawCategory === "decals";
  const legacySubSubcategory = normalizeSubSubcategory(product.subSubcategory);
  const position = String(product.position || product.placement || (isDecal ? product.subcategory : "") || "").trim();
  const jsonSubcategory = String(
    product.subcategory ||
    product.decalType ||
    product.type ||
    product.style ||
    legacySubSubcategory ||
    ""
  ).trim();
  const previewImagePath = product.preview_image_path || product.imagePath || "/assets/imgs/main.PNG";
  const svgFilePath = product.svg_file_path || product.svgFilePath || product.previewSvgPath || product.stripeOptions?.previewSvgPath || "";
  const cutFilePath = product.cut_file_path || product.cutFilePath || "";
  const displayCategory = titleCaseCategory(rawCategory);
  const displaySubcategory = isDecal ? (position || jsonSubcategory) : jsonSubcategory;
  const displaySubSubcategory = isDecal ? (jsonSubcategory || null) : legacySubSubcategory;
  const customizable = normalizeBoolean(product.customizable, product.custom);
  const tags = normalizeTags(product.tags, displayCategory, displaySubcategory, displaySubSubcategory);

  return {
    id,
    name,
    description: String(product.description || ""),
    price: Number(product.price || 0),
    category: displayCategory,
    category_key: rawCategory,
    subcategory: displaySubcategory,
    subSubcategory: displaySubSubcategory,
    position,
    placement: position,
    decalType: displaySubSubcategory || jsonSubcategory,
    type: displaySubSubcategory || jsonSubcategory,
    style: displaySubSubcategory || jsonSubcategory,
    preview_image_path: previewImagePath,
    svg_file_path: svgFilePath,
    cut_file_path: cutFilePath,
    imagePath: previewImagePath,
    imageLabel: product.imageLabel || name,
    svgFilePath,
    cutFilePath,
    customizable,
    custom: customizable,
    slug: normalizeSlug(product.slug, name || id),
    tags,
    featured: normalizeBoolean(product.featured),
    customizeUrl: product.customizeUrl,
    customizeCtaLabel: product.customizeCtaLabel,
    stripeOptions: product.stripeOptions,
    graphicOptions: product.graphicOptions
  };
}

function toProductsJsonShape(product = {}) {
  const normalized = normalizeRawProduct(product);
  return {
    id: normalized.id,
    name: normalized.name,
    description: normalized.description,
    price: normalized.price,
    category: normalized.category_key || String(product.category || "decals").trim().toLowerCase() || "decals",
    subcategory: String(product.subcategory || normalized.decalType || normalized.subSubcategory || "").trim(),
    position: String(product.position || normalized.position || "").trim(),
    preview_image_path: product.preview_image_path || normalized.preview_image_path || "/assets/imgs/main.PNG",
    svg_file_path: product.svg_file_path || normalized.svg_file_path || "",
    cut_file_path: product.cut_file_path || normalized.cut_file_path || "",
    customizable: normalizeBoolean(product.customizable, normalized.customizable)
  };
}

function legacyProductToJsonShape(product = {}) {
  const rawCategory = String(product.category || "decals").trim().toLowerCase() || "decals";
  const isDecal = rawCategory === "decals";
  return {
    id: normalizeProductId(product.name, product.id),
    name: String(product.name || "Untitled Product").trim(),
    description: String(product.description || ""),
    price: Number(product.price || 0),
    category: rawCategory,
    subcategory: isDecal
      ? String(product.subSubcategory || product.decalType || product.type || product.subcategory || "").trim()
      : String(product.subcategory || "").trim(),
    position: isDecal ? String(product.position || product.placement || product.subcategory || "").trim() : "",
    preview_image_path: product.preview_image_path || product.imagePath || "/assets/imgs/main.PNG",
    svg_file_path: product.svg_file_path || product.svgFilePath || product.previewSvgPath || product.stripeOptions?.previewSvgPath || "",
    cut_file_path: product.cut_file_path || product.cutFilePath || "",
    customizable: normalizeBoolean(product.customizable, product.custom)
  };
}

function ensureProductsFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(productsFilePath)) {
    const db = readDb();
    const products = Array.isArray(db.products) ? db.products.map(legacyProductToJsonShape) : [];
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), "utf8");
  }
}

function readProductsFile() {
  ensureProductsFile();
  try {
    const raw = fs.readFileSync(productsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProductsFile(products) {
  ensureProductsFile();
  fs.writeFileSync(productsFilePath, JSON.stringify(products.map(toProductsJsonShape), null, 2), "utf8");
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
  return readProductsFile().map(normalizeRawProduct);
}

function getProductById(id) {
  return getAllProducts().find((product) => product.id === id) || null;
}

function createProduct(payload) {
  const products = readProductsFile();
  const nextProduct = toProductsJsonShape(payload);

  if (products.some((product) => product.id === nextProduct.id)) {
    throw new Error("A product with that id already exists.");
  }

  products.push(nextProduct);
  writeProductsFile(products);
  return normalizeRawProduct(nextProduct);
}

function updateProduct(id, payload) {
  const products = readProductsFile();
  const index = products.findIndex((product) => product.id === id);

  if (index < 0) return null;

  const current = products[index];
  const merged = {
    ...current,
    ...payload,
    preview_image_path: payload.preview_image_path ?? payload.imagePath ?? current.preview_image_path,
    svg_file_path: payload.svg_file_path ?? payload.svgFilePath ?? current.svg_file_path,
    cut_file_path: payload.cut_file_path ?? payload.cutFilePath ?? current.cut_file_path,
    customizable: payload.customizable ?? payload.custom ?? current.customizable
  };

  products[index] = toProductsJsonShape(merged);
  writeProductsFile(products);
  return normalizeRawProduct(products[index]);
}

function deleteProduct(id) {
  const products = readProductsFile();
  const index = products.findIndex((product) => product.id === id);

  if (index < 0) return false;

  products.splice(index, 1);
  writeProductsFile(products);
  return true;
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
