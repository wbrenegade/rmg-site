const fs = require("fs");
const path = require("path");
const { getAllProducts } = require("../models/productModel");

const rootDir = path.join(__dirname, "..", "..");
const decalProductsDir = path.join(rootDir, "public", "assets", "imgs", "decals", "products");

const placementLabels = {
  "fender": "Fender",
  "full-body-half-body": "Full Body/Half Body",
  "hood": "Hood",
  "rear-quarter-panel": "Rear Quarter Panel",
  "rocker-panel-side": "Rocker Panel/Side",
  "windshield-rear-window": "Windshield/Rear Window",
  "windhsield-rear-window": "Windshield/Rear Window"
};

const typeLabels = {
  "brands": "Brands",
  "geometrical-patterns": "Geometrical Patterns",
  "graphics": "Graphics",
  "platform-specific": "Platform Specific",
  "racing-stripes": "Racing Stripes",
  "stripes": "Racing Stripes",
  "rips-scratches-tears": "Rips/Scratches/Tears",
  "sponsor-stacks-rows": "Sponsor Stacks/Rows",
  "sponsor-stacks": "Sponsor Stacks/Rows",
  "sponsor-rows": "Sponsor Stacks/Rows"
};

function titleCaseSlug(value) {
  return String(value || "")
    .replace(/\.[^.]+$/, "")
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function listDecalAssetProducts() {
  if (!fs.existsSync(decalProductsDir)) return [];

  return fs.readdirSync(decalProductsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.includes("__"))
    .flatMap((folder) => {
      const [placementSlug, typeSlug] = folder.name.split("__");
      const placement = placementLabels[placementSlug] || titleCaseSlug(placementSlug);
      const decalType = typeLabels[typeSlug] || titleCaseSlug(typeSlug);
      const folderPath = path.join(decalProductsDir, folder.name);

      return fs.readdirSync(folderPath, { withFileTypes: true })
        .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|svg)$/i.test(entry.name))
        .map((file) => {
          const productName = titleCaseSlug(file.name);
          const id = `decal-${slugify(folder.name)}-${slugify(productName)}`;

          return {
            id,
            name: productName,
            slug: id,
            category: "Decals",
            subcategory: placement,
            subSubcategory: decalType,
            placement,
            decalType,
            type: decalType,
            style: decalType,
            price: 49.99,
            tags: ["Decals", placement, decalType],
            imagePath: `/assets/imgs/decals/products/${folder.name}/${file.name}`,
            imageLabel: productName,
            description: `${productName} decal for ${placement.toLowerCase()} placement.`,
            featured: false,
            custom: false,
            source: "decal-product-folder"
          };
        });
    });
}

function listProducts(req, res) {
  const dbProducts = getAllProducts();
  const dbIds = new Set(dbProducts.map((product) => product.id));
  const assetProducts = listDecalAssetProducts().filter((product) => !dbIds.has(product.id));

  res.json([...dbProducts, ...assetProducts]);
}

module.exports = {
  listProducts
};
