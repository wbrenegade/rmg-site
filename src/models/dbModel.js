const fs = require("fs");
const path = require("path");
const { defaultProducts } = require("./defaultProducts");

const rootDir = path.join(__dirname, "..", "..");
const dataDir = path.join(rootDir, "data");
const dbFilePath = path.join(dataDir, "db.json");

const defaultSiteSettings = {
  homeEyebrow: "Custom Vinyl That Fits Your Build",
  homeTitle: "Decals and kits built for real cars and real brands.",
  homePhrase: "We sell decals, car-specific decal kits, pre-cut window tint kits, and fully custom decals/graphics made to match your exact style."
};

const defaultCategories = [
  {
    name: "Decals",
    hasSubcategories: true,
    subcategoryCount: 7,
    imagePath: "/assets/imgs/decal-cats/custom.png",
    subcategories: [
      { name: "Custom", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/decal-cats/custom.png", subcategories: null },
      { name: "Fender", hasSubcategories: true, subcategoryCount: 1, imagePath: "/assets/imgs/decal-cats/fender.png", subcategories: [{ name: "Sponsor Stacks", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }] },
      { name: "Full Body/Half Body", hasSubcategories: true, subcategoryCount: 1, imagePath: "/assets/imgs/decal-cats/full_body_half_body.png", subcategories: [{ name: "Racing Stripes", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/decal-sub-cats/racing_Stripes.png", subcategories: null }] },
      { name: "Platform Specific", hasSubcategories: true, subcategoryCount: 2, imagePath: "/assets/imgs/decal-cats/platform_specific.png", subcategories: [{ name: "Graphics", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }, { name: "Racing Stripes", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/decal-sub-cats/racing_Stripes.png", subcategories: null }] },
      { name: "Rear Quarter Panel", hasSubcategories: true, subcategoryCount: 4, imagePath: "/assets/imgs/decal-cats/rear_quarter_panel.png", subcategories: [{ name: "Geometrical Patterns", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }, { name: "Graphics", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }, { name: "Racing Stripes", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/decal-sub-cats/racing_Stripes.png", subcategories: null }, { name: "Rips/Scratches/Tears", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }] },
      { name: "Rocker Panel/Side", hasSubcategories: true, subcategoryCount: 3, imagePath: "/assets/imgs/decal-cats/rocker_panel_side.png", subcategories: [{ name: "Brands", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }, { name: "Racing Stripes", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/decal-sub-cats/racing_Stripes.png", subcategories: null }, { name: "Sponsor Rows", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }] },
      { name: "Windshield/Rear Window Banners", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/decal-cats/windshield.png", subcategories: null }
    ]
  },
  {
    name: "Window Tint",
    hasSubcategories: true,
    subcategoryCount: 2,
    imagePath: "/assets/imgs/main.PNG",
    subcategories: [
      { name: "Full Rolls", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null },
      { name: "Precut Kits", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }
    ]
  },
  {
    name: "Lettering",
    hasSubcategories: true,
    subcategoryCount: 2,
    imagePath: "/assets/imgs/main.PNG",
    subcategories: [
      { name: "Business Info", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null },
      { name: "Business Name", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }
    ]
  },
  {
    name: "Wraps",
    hasSubcategories: true,
    subcategoryCount: 2,
    imagePath: "/assets/imgs/main.PNG",
    subcategories: [
      { name: "Full Rolls", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null },
      { name: "By The Foot", hasSubcategories: false, subcategoryCount: null, imagePath: "/assets/imgs/main.PNG", subcategories: null }
    ]
  }
];

function normalizeCategoryNode(node = {}) {
  const subcategories = Array.isArray(node.subcategories)
    ? node.subcategories.map((child) => normalizeCategoryNode(child))
    : null;

  const hasSubcategories = typeof node.hasSubcategories === "boolean"
    ? node.hasSubcategories
    : Boolean(subcategories && subcategories.length);

  const subcategoryCount = subcategories
    ? subcategories.length
    : (node.subcategoryCount === undefined ? null : node.subcategoryCount);

  return {
    name: String(node.name || ""),
    hasSubcategories,
    subcategoryCount,
    imagePath: node.imagePath || "",
    subcategories
  };
}

function normalizeCategories(categories = []) {
  if (!Array.isArray(categories) || !categories.length) {
    return defaultCategories;
  }

  return categories.map((node) => normalizeCategoryNode(node));
}

function normalizeProducts(products = []) {
  return products.map((product, index) => {
    const id = String(product.id || `product-${index + 1}`);
    const name = String(product.name || "Untitled Product");
    const slug = String(product.slug || name)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `product-${index + 1}`;
    const category = String(product.category || "");
    const subcategory = String(product.subcategory || "");
    const subSubcategory = product.subSubcategory === undefined || product.subSubcategory === ""
      ? null
      : product.subSubcategory;
    const tags = Array.isArray(product.tags)
      ? product.tags.map((tag) => String(tag || "").trim()).filter(Boolean)
      : [category, subcategory, subSubcategory].filter(Boolean);

    return {
      id,
      name,
      slug,
      category,
      subcategory,
      subSubcategory,
      price: Number(product.price || 0),
      tags,
      imagePath: product.imagePath || "/assets/imgs/main.PNG",
      imageLabel: product.imageLabel || "Product Preview",
      description: product.description || "",
      featured: Boolean(product.featured),
      custom: Boolean(product.custom)
    };
  });
}

function buildInitialData() {
  return {
    users: [],
    orders: [],
    messages: [],
    categories: defaultCategories,
    products: defaultProducts,
    siteSettings: defaultSiteSettings
  };
}

function normalizeDb(parsed = {}) {
  const parsedProducts = Array.isArray(parsed.products) && parsed.products.length
    ? normalizeProducts(parsed.products)
    : defaultProducts;

  return {
    users: Array.isArray(parsed.users) ? parsed.users : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    categories: normalizeCategories(parsed.categories),
    products: parsedProducts,
    siteSettings: {
      ...defaultSiteSettings,
      ...(parsed.siteSettings || {})
    }
  };
}

function ensureDbFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dbFilePath)) {
    const initialData = buildInitialData();
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), "utf8");
    return;
  }

  try {
    const raw = fs.readFileSync(dbFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const normalized = normalizeDb(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      fs.writeFileSync(dbFilePath, JSON.stringify(normalized, null, 2), "utf8");
    }
  } catch {
    const initialData = buildInitialData();
    fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function readDb() {
  ensureDbFile();
  const raw = fs.readFileSync(dbFilePath, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return normalizeDb(parsed);
  } catch {
    return buildInitialData();
  }
}

function writeDb(data) {
  ensureDbFile();
  fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), "utf8");
}

module.exports = {
  ensureDbFile,
  readDb,
  writeDb,
  dbFilePath
};
