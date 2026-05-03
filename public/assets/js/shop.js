const DECAL_IMAGE_BASE = "/assets/imgs/decals";
const FALLBACK_IMAGE = "/assets/imgs/main.PNG";
const SHOP_CATEGORIES = ["Decals", "Lettering", "Wraps"];

const DECAL_GROUPS = ["By Placement", "By Type", "Custom"];

const DECAL_FILTERS = {
  "By Placement": [
    "Fender",
    "Full Body/Half Body",
    "Hood",
    "Rear Quarter Panel",
    "Rocker Panel/Side",
    "Windshield/Rear Window"
  ],
  "By Type": [
    "Brands",
    "Graphics",
    "Platform Specific",
    "Racing Stripes",
    "Sponsor Stacks/Rows"
  ],
  "Custom": []
};

const GRAPHICS_FILTERS = [
  "All Graphics",
  "Geometrical Patterns",
  "Rips/Scratches/Tears"
];

const PLACEMENT_IMAGES = {
  "Fender": `${DECAL_IMAGE_BASE}/placements/fender.png`,
  "Full Body/Half Body": `${DECAL_IMAGE_BASE}/placements/full-body-half-body.png`,
  "Hood": `${DECAL_IMAGE_BASE}/placements/hood.png`,
  "Rear Quarter Panel": `${DECAL_IMAGE_BASE}/placements/rear-quarter-panel.png`,
  "Rocker Panel/Side": `${DECAL_IMAGE_BASE}/placements/rocker-panel-side.png`,
  "Windshield/Rear Window": `${DECAL_IMAGE_BASE}/placements/windhsield-rear-window.png`
};

const TYPE_IMAGES = {
  "Brands": `${DECAL_IMAGE_BASE}/types/brands.png`,
  "Graphics": `${DECAL_IMAGE_BASE}/types/graphics.png`,
  "Platform Specific": `${DECAL_IMAGE_BASE}/types/platform-specific.png`,
  "Racing Stripes": `${DECAL_IMAGE_BASE}/types/racing-stripes.png`,
  "Sponsor Stacks/Rows": `${DECAL_IMAGE_BASE}/types/sponsor-stacks-rows.png`
};

const GRAPHICS_IMAGES = {
  "All Graphics": TYPE_IMAGES.Graphics,
  "Geometrical Patterns": TYPE_IMAGES.Graphics,
  "Rips/Scratches/Tears": TYPE_IMAGES.Graphics
};

const CATEGORY_IMAGES = {
  "Decals": `${DECAL_IMAGE_BASE}/decals.png`,
  "Lettering": "/assets/imgs/lettering/lettering.png",
  "Wraps": "/assets/imgs/wraps/wraps.png"
};

const NON_DECAL_SUBCATEGORY_IMAGES = {
  "Precut Kits": FALLBACK_IMAGE,
  "Full Rolls": FALLBACK_IMAGE,
  "By The Foot": FALLBACK_IMAGE,
  "Business Name": CATEGORY_IMAGES.Lettering,
  "Business Info": CATEGORY_IMAGES.Lettering
};

let currentStripeQuickProduct = null;
let currentRenderedProductsById = new Map();

function isRacingStripeProduct(product) {
  if (!product) return false;
  if (normalizeText(product.subcategory) === "racing stripes") return true;
  if (normalizeText(product.subSubcategory) === "racing stripes") return true;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  return tags.some((tag) => normalizeText(tag) === "racing stripes");
}

function isFlameProduct(product) {
  if (!product) return false;
  return getProductSearchText(product).includes("flame");
}

function inferMultipleStripeLayout(product, widths) {
  if (typeof product?.stripeOptions?.hasMultipleStripes === "boolean") {
    return product.stripeOptions.hasMultipleStripes;
  }

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...widths
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes("dual")
    || searchable.includes("double")
    || searchable.includes("multi")
    || searchable.includes("staggered")
    || searchable.includes("pinstripe")
    || searchable.includes("center +")
    || searchable.includes("/")
    || searchable.includes("pair");
}

function inferOutlinedStripe(product, outlineColors) {
  if (typeof product?.stripeOptions?.hasOutline === "boolean") {
    return product.stripeOptions.hasOutline;
  }

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return outlineColors.length > 0 || searchable.includes("outline") || searchable.includes("outlined");
}

function inferTopStripe(product) {
  if (typeof product?.stripeOptions?.hasTopStripe === "boolean") {
    return product.stripeOptions.hasTopStripe;
  }

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return searchable.includes("dual top outlined");
}

function getProductSearchText(product) {
  return [
    product?.name,
    product?.slug,
    product?.id,
    product?.description,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function inferAccentStyle(product) {
  const searchable = getProductSearchText(product);
  if (searchable.includes("top outlined")) return "Above";
  if (searchable.includes("bottom outlined")) return "Below";
  return "Both";
}

const RACING_STRIPE_PREVIEW_BASE = "/assets/svg/racing-stripes";
const racingStripePreviewSvgCache = new Map();
const productJsonRecordCache = new Map();

function getRacingStripePreviewSvgPath(product) {
  if (product?.svg_file_path || product?.svgFilePath) {
    return product.svg_file_path || product.svgFilePath;
  }

  if (product?.stripeOptions?.previewSvgPath) {
    return product.stripeOptions.previewSvgPath;
  }

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (searchable.includes("staggered")) return `${RACING_STRIPE_PREVIEW_BASE}/staggered-stripes.svg`;
  if (searchable.includes("dual top outlined")) return `${RACING_STRIPE_PREVIEW_BASE}/dual-top-outlined-stripes.svg`;
  if (searchable.includes("outlined single") || searchable.includes("single outlined")) return `${RACING_STRIPE_PREVIEW_BASE}/single-outlined-stripe.svg`;
  if (searchable.includes("dual") || searchable.includes("double")) return `${RACING_STRIPE_PREVIEW_BASE}/dual-stripes.svg`;
  return `${RACING_STRIPE_PREVIEW_BASE}/single-stripe.svg`;
}

async function loadRacingStripePreviewSvg(path) {
  if (!racingStripePreviewSvgCache.has(path)) {
    racingStripePreviewSvgCache.set(path, fetch(path).then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return response.text();
    }));
  }

  return racingStripePreviewSvgCache.get(path);
}

function getDecalColorOptions(product) {
  const configuredColors = Array.isArray(product?.flameOptions?.colors)
    ? product.flameOptions.colors
    : Array.isArray(product?.decalOptions?.colors)
      ? product.decalOptions.colors
      : [];

  return (configuredColors.length ? configuredColors : ["Gloss Black", "Matte Black", "Satin Charcoal", "Gloss White", "Race Red", "Nardo Gray"])
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function getSvgAttribute(tag, name) {
  const match = String(tag || "").match(new RegExp(`\\s${name}="([^"]*)"`, "i"));
  return match ? match[1] : "";
}

function setSvgAttribute(tag, name, value) {
  const attributePattern = new RegExp(`\\s${name}="[^"]*"`, "i");
  if (attributePattern.test(tag)) {
    return tag.replace(attributePattern, ` ${name}="${value}"`);
  }

  return tag.replace(/\/?>$/, ` ${name}="${value}"$&`);
}

function getAccentHeightValue(sizeLabel, fallbackHeight) {
  const parsed = parseInchValue(sizeLabel, fallbackHeight);
  if (String(sizeLabel || "").toLowerCase().includes("thin")) return 0.3;
  if (String(sizeLabel || "").toLowerCase().includes("medium")) return 0.6;
  if (String(sizeLabel || "").toLowerCase().includes("thick")) return 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackHeight;
}

function applyRacingStripeAccentOptions(svgText, accentColorHex, accentStyle, accentSize) {
  const rectMatches = [...String(svgText || "").matchAll(/<rect\b[^>]*\/?>/gi)];
  if (rectMatches.length < 2) return svgText;

  const rects = rectMatches.map((match, index) => {
    const tag = match[0];
    const height = Number(getSvgAttribute(tag, "height"));
    const y = Number(getSvgAttribute(tag, "y"));
    const x = Number(getSvgAttribute(tag, "x"));
    const width = Number(getSvgAttribute(tag, "width"));

    return { tag, index, height, y, x, width };
  }).filter((rect) => Number.isFinite(rect.height) && Number.isFinite(rect.y));

  if (rects.length < 2) return svgText;

  const maxHeight = Math.max(...rects.map((rect) => rect.height));
  const mainRects = rects.filter((rect) => rect.height >= maxHeight * 0.65);
  const accentRects = rects.filter((rect) => rect.height < maxHeight * 0.65);
  if (!mainRects.length || !accentRects.length) return svgText;

  const template = accentRects.reduce((widest, rect) => rect.width > widest.width ? rect : widest, accentRects[0]);
  const minMainY = Math.min(...mainRects.map((rect) => rect.y));
  const maxMainBottom = Math.max(...mainRects.map((rect) => rect.y + rect.height));
  const fallbackGap = Math.max(0.45, template.height * 3.5);
  const topAccent = accentRects.find((rect) => rect.y < minMainY);
  const bottomAccent = accentRects.find((rect) => rect.y > maxMainBottom);
  const topGap = topAccent ? minMainY - (topAccent.y + topAccent.height) : fallbackGap;
  const bottomGap = bottomAccent ? bottomAccent.y - maxMainBottom : fallbackGap;
  const accentHeight = getAccentHeightValue(accentSize, template.height);
  const normalizedStyle = String(accentStyle || "Both").toLowerCase();
  const useAbove = normalizedStyle === "above" || normalizedStyle === "both";
  const useBelow = normalizedStyle === "below" || normalizedStyle === "both";

  const buildAccentRect = (y, idSuffix) => {
    let tag = template.tag;
    tag = setSvgAttribute(tag, "id", `${getSvgAttribute(template.tag, "id") || "accent"}-${idSuffix}`);
    tag = setSvgAttribute(tag, "height", accentHeight.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""));
    tag = setSvgAttribute(tag, "y", y.toFixed(6).replace(/0+$/, "").replace(/\.$/, ""));
    return tag;
  };

  const accentTags = [];
  if (useAbove) {
    accentTags.push(buildAccentRect(minMainY - topGap - accentHeight, "above"));
  }
  if (useBelow) {
    accentTags.push(buildAccentRect(maxMainBottom + bottomGap, "below"));
  }

  const accentIndexes = new Set(accentRects.map((rect) => rect.index));
  let rectIndex = 0;
  const withoutAccentRects = String(svgText).replace(/<rect\b[^>]*\/?>/gi, (tag) => {
    const shouldRemove = accentIndexes.has(rectIndex);
    rectIndex += 1;
    return shouldRemove ? "" : tag;
  });

  const updatedSvg = withoutAccentRects.replace(/<\/g>/i, `${accentTags.join("")}</g>`);
  return updatedSvg.replace(/(<rect\b(?=[^>]*(?:accent|above|below)[^>]*)[^>]*style="[^"]*)fill:\s*#[0-9a-fA-F]{3,8}/gi, `$1fill:${accentColorHex}`);
}

function colorizeRacingStripeSvg(svgText, stripeColorHex, outlineColorHex, accentOptions = {}) {
  const cleanedSvg = String(svgText || "")
    .replace(/<\?xml[^>]*>\s*/i, "")
    .replace(/<!--[\s\S]*?-->\s*/g, "");

  const colorizedSvg = cleanedSvg
    .replace(/<svg\b([^>]*)>/i, (svgTag, attributes) => {
      const cleanedAttributes = attributes.replace(/\s(width|height)="[^"]*"/g, "");
      return `<svg class="stripe-preview-svg" preserveAspectRatio="xMidYMid meet" overflow="visible"${cleanedAttributes}>`;
    })
    .replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, `fill:${stripeColorHex}`)
    .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/g, `stroke:${outlineColorHex}`);

  if (!accentOptions.enabled) return colorizedSvg;

  return applyRacingStripeAccentOptions(
    colorizedSvg,
    accentOptions.colorHex || outlineColorHex,
    accentOptions.style || "Both",
    accentOptions.size || "Thin"
  );
}

function renderRacingStripeAssetPreview(svgText, stripeColorHex, outlineColorHex, accentOptions) {
  return `
    <div class="stripe-preview-surface" role="img" aria-label="Live stripe preview">
      ${colorizeRacingStripeSvg(svgText, stripeColorHex, outlineColorHex, accentOptions)}
    </div>
  `;
}

function colorizeDecalSvg(svgText, colorHex, className = "stripe-preview-svg") {
  const cleanedSvg = String(svgText || "")
    .replace(/<\?xml[^>]*>\s*/i, "")
    .replace(/<!--[\s\S]*?-->\s*/g, "");

  return cleanedSvg
    .replace(/<svg\b([^>]*)>/i, (svgTag, attributes) => {
      const cleanedAttributes = attributes.replace(/\s(width|height)="[^"]*"/g, "");
      return `<svg class="${className}" preserveAspectRatio="xMidYMid meet" overflow="visible" fill="${colorHex}"${cleanedAttributes}>`;
    })
    .replace(/fill:\s*(?!none\b)#[0-9a-fA-F]{3,8}/g, `fill:${colorHex}`)
    .replace(/\sfill="(?!none\b)[^"]*"/gi, ` fill="${colorHex}"`);
}

function renderDecalAssetPreview(svgText, colorHex, label = "Live decal preview") {
  return `
    <div class="stripe-preview-surface" role="img" aria-label="${label}">
      ${colorizeDecalSvg(svgText, colorHex)}
    </div>
  `;
}

function getRacingStripeOptions(product) {
  const subcategory = String(product?.subcategory || "").toLowerCase();
  const widthFallback = subcategory.includes("rocker")
    ? ["3 in", "4 in", "5 in", "6 in"]
    : ["8 in / 8 in", "10 in / 10 in", "12 in / 12 in", "10 in center + 2 in pinstripes"];

  const widthOptions = Array.isArray(product?.stripeOptions?.widths)
    ? product.stripeOptions.widths
    : widthFallback;
  const colorOptions = Array.isArray(product?.stripeOptions?.colors)
    ? product.stripeOptions.colors
    : ["Gloss Black", "Matte Black", "Satin Charcoal", "Gloss White", "Race Red", "Nardo Gray"];
  const spacingOptions = Array.isArray(product?.stripeOptions?.spacings)
    ? product.stripeOptions.spacings
    : ["0.25 in", "0.5 in", "0.75 in", "1.0 in", "1.5 in"];
  const explicitOutlineColors = Array.isArray(product?.stripeOptions?.outlineColors)
    ? product.stripeOptions.outlineColors
    : [];
  const fallbackOutlineColors = ["Gloss Black", "Matte Black", "Gloss White", "Race Red", "Nardo Gray"];

  const widths = widthOptions.map((value) => String(value || "").trim()).filter(Boolean);
  const colors = colorOptions.map((value) => String(value || "").trim()).filter(Boolean);
  const spacings = spacingOptions.map((value) => String(value || "").trim()).filter(Boolean);
  const explicitOutlineColorValues = explicitOutlineColors.map((value) => String(value || "").trim()).filter(Boolean);
  const hasOutline = inferOutlinedStripe(product, explicitOutlineColorValues);
  const outlineColors = explicitOutlineColorValues.length ? explicitOutlineColorValues : fallbackOutlineColors;
  const isOutlined = hasOutline || getProductSearchText(product).includes("outlined");

  return {
    widths,
    colors,
    spacings,
    outlineColors,
    hasMultipleStripes: inferMultipleStripeLayout(product, widths),
    hasOutline: isOutlined,
    hasTopStripe: inferTopStripe(product),
    accentStyles: ["Above", "Below", "Both"],
    accentSizes: ["Thin", "Medium", "Thick"],
    defaultAccentStyle: inferAccentStyle(product),
    previewSvgPath: getRacingStripePreviewSvgPath(product)
  };
}

async function getProductJsonRecord(productId) {
  const normalizedProductId = String(productId || "").trim();
  if (!normalizedProductId) return null;

  if (!productJsonRecordCache.has(normalizedProductId)) {
    const productPromise = fetch("/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load products JSON.");
        return response.json();
      })
      .then((products) => {
        if (!Array.isArray(products)) return null;
        return products.find((product) => String(product.id || "").trim() === normalizedProductId) || null;
      })
      .catch(() => null);

    productJsonRecordCache.set(normalizedProductId, productPromise);
  }

  return productJsonRecordCache.get(normalizedProductId);
}

function parseInchValue(input, fallback) {
  const match = String(input || "").match(/\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStripeWidths(widthLabel, hasMultipleStripes) {
  const label = String(widthLabel || "");
  const values = label.match(/\d+(?:\.\d+)?/g) || [];
  const parsed = values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);

  if (!hasMultipleStripes) return [parsed[0] || 4];
  if (parsed.length >= 2) return [parsed[0], parsed[1]];

  const fallback = parsed[0] || 4;
  return [fallback, fallback];
}

function stripeColorToHex(colorValue) {
  const name = String(colorValue || "").trim().toLowerCase();
  const palette = {
    "gloss black": "#111111",
    "matte black": "#2a2a2a",
    "satin charcoal": "#4e545c",
    "gloss white": "#f5f5f5",
    "race red": "#cf1f2b",
    "nardo gray": "#9ca1a6"
  };

  if (palette[name]) return palette[name];
  if (/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(colorValue || "")) return colorValue;
  return "#111111";
}

function getStripeQuickModalElements() {
  return {
    modal: document.getElementById("stripeQuickCustomizeModal"),
    body: document.getElementById("stripeQuickCustomizeBody"),
    title: document.getElementById("stripeQuickCustomizeTitle"),
    closeBtn: document.getElementById("stripeQuickCloseBtn")
  };
}

function closeStripeQuickModal() {
  const { modal } = getStripeQuickModalElements();
  if (!modal) return;
  modal.setAttribute("hidden", "hidden");
  document.body.classList.remove("modal-open");
}

function renderStripeQuickLivePreview(container, options) {
  const previewCanvas = container.querySelector("#stripeQuickPreviewCanvas");
  const previewMeta = container.querySelector("#stripeQuickPreviewMeta");
  const widthSelect = container.querySelector("#quickStripeWidthSelect");
  const colorSelect = container.querySelector("#quickStripeColorSelect");
  const spacingSelect = container.querySelector("#quickStripeSpacingSelect");
  const outlineColorSelect = container.querySelector("#quickStripeOutlineColorSelect");
  const accentStyleSelect = container.querySelector("#quickStripeAccentStyleSelect");
  const accentSizeSelect = container.querySelector("#quickStripeAccentSizeSelect");

  if (!(previewCanvas && previewMeta && widthSelect && colorSelect)) return;
  let previewRequestId = 0;

  const update = () => {
    const requestId = ++previewRequestId;
    const selectedWidth = widthSelect.value || options.widths[0] || "4 in";
    const selectedColor = colorSelect.value || options.colors[0] || "Gloss Black";
    const selectedSpacing = spacingSelect?.value || options.spacings[0] || "0.5 in";
    const selectedOutline = outlineColorSelect?.value || options.outlineColors[0] || "Gloss White";
    const selectedAccentStyle = accentStyleSelect?.value || options.defaultAccentStyle || "Both";
    const selectedAccentSize = accentSizeSelect?.value || options.accentSizes[0] || "Thin";

    const stripeColorHex = stripeColorToHex(selectedColor);
    const outlineColorHex = options.hasOutline ? stripeColorToHex(selectedOutline) : stripeColorHex;
    const accentOptions = {
      enabled: options.hasOutline,
      colorHex: outlineColorHex,
      style: selectedAccentStyle,
      size: selectedAccentSize
    };

    loadRacingStripePreviewSvg(options.previewSvgPath)
      .then((svgText) => {
        if (requestId !== previewRequestId) return;
        previewCanvas.innerHTML = renderRacingStripeAssetPreview(svgText, stripeColorHex, outlineColorHex, accentOptions);
      })
      .catch(() => {
        if (requestId !== previewRequestId) return;
        previewCanvas.innerHTML = `
          <div class="stripe-preview-surface" role="img" aria-label="Live stripe preview">
            <svg class="stripe-preview-svg" viewBox="0 0 74.913506 8.0984497" preserveAspectRatio="xMidYMid meet">
              <rect x="0.6" y="0.6" width="73.7" height="2.7" fill="${stripeColorHex}" stroke="${outlineColorHex}" stroke-width="1.2" />
              <rect x="0.6" y="4.8" width="73.7" height="2.7" fill="${stripeColorHex}" stroke="${outlineColorHex}" stroke-width="1.2" />
            </svg>
          </div>
        `;
      });

    const meta = [`Width: ${selectedWidth}`, `Color: ${selectedColor}`];
    if (options.hasMultipleStripes) meta.push(`Spacing: ${selectedSpacing}`);
    if (options.hasOutline) meta.push(`Outline: ${selectedOutline}`);
    if (options.hasOutline) meta.push(`Accent: ${selectedAccentStyle} ${selectedAccentSize}`);
    previewMeta.textContent = meta.join(" • ");
  };

  [widthSelect, colorSelect, spacingSelect, outlineColorSelect, accentStyleSelect, accentSizeSelect].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", update);
    input.addEventListener("change", update);
  });

  update();
}

function openStripeQuickModal(product) {
  const { modal, body, title } = getStripeQuickModalElements();
  if (!(modal && body && title)) return;

  const options = getRacingStripeOptions(product);
  options.previewSvgPath = product?.svg_file_path || product?.svgFilePath || options.previewSvgPath;
  const spacingMarkup = options.hasMultipleStripes && options.spacings.length
    ? `
      <label>
        Stripe Spacing
        <select id="quickStripeSpacingSelect" aria-label="Stripe spacing">
          ${options.spacings.map((spacing) => `<option value="${spacing}">${spacing}</option>`).join("")}
        </select>
      </label>
    `
    : "";
  const outlineMarkup = options.hasOutline && options.outlineColors.length
    ? `
      <label>
        Accent Color
        <select id="quickStripeOutlineColorSelect" aria-label="Stripe outline color">
          ${options.outlineColors.map((color) => `<option value="${color}">${color}</option>`).join("")}
        </select>
      </label>
      <label>
        Accent Style
        <select id="quickStripeAccentStyleSelect" aria-label="Stripe accent style">
          ${options.accentStyles.map((style) => `<option value="${style}"${style === options.defaultAccentStyle ? " selected" : ""}>${style}</option>`).join("")}
        </select>
      </label>
      <label>
        Accent Size
        <select id="quickStripeAccentSizeSelect" aria-label="Stripe accent size">
          ${options.accentSizes.map((size) => `<option value="${size}">${size}</option>`).join("")}
        </select>
      </label>
    `
    : "";

  currentStripeQuickProduct = product;
  title.textContent = product.name || "Racing Stripe";
  const fullProductUrl = product.productUrl || `/product?id=${encodeURIComponent(product.id)}`;

  body.innerHTML = `
    <div class="stripe-quick-grid">
      <div class="product-option-grid">
        <label>
          Stripe Width
          <select id="quickStripeWidthSelect" aria-label="Stripe width">
            ${options.widths.map((width) => `<option value="${width}">${width}</option>`).join("")}
          </select>
        </label>
        <label>
          Stripe Color
          <select id="quickStripeColorSelect" aria-label="Stripe color">
            ${options.colors.map((color) => `<option value="${color}">${color}</option>`).join("")}
          </select>
        </label>
        ${spacingMarkup}
        ${outlineMarkup}
      </div>

      <div class="stripe-live-preview stripe-live-preview--modal">
        <p class="stripe-live-preview__title">Live Preview</p>
        <div class="stripe-live-preview__canvas" id="stripeQuickPreviewCanvas"></div>
        <p class="inline-note stripe-live-preview__meta" id="stripeQuickPreviewMeta"></p>
      </div>
    </div>

    <div class="product-actions stripe-quick-actions">
      <a class="btn btn-outline" href="${fullProductUrl}">Open Full Product</a>
      <button type="button" class="btn" id="quickStripeAddToCartBtn">Add To Cart</button>
    </div>
  `;

  renderStripeQuickLivePreview(body, options);

  const addBtn = body.querySelector("#quickStripeAddToCartBtn");
  addBtn?.addEventListener("click", () => {
    const widthValue = body.querySelector("#quickStripeWidthSelect")?.value?.trim() || "";
    const colorValue = body.querySelector("#quickStripeColorSelect")?.value?.trim() || "";
    const spacingValue = options.hasMultipleStripes
      ? (body.querySelector("#quickStripeSpacingSelect")?.value?.trim() || "")
      : "";
    const outlineValue = options.hasOutline
      ? (body.querySelector("#quickStripeOutlineColorSelect")?.value?.trim() || "")
      : "";
    const accentStyleValue = options.hasOutline
      ? (body.querySelector("#quickStripeAccentStyleSelect")?.value?.trim() || "")
      : "";
    const accentSizeValue = options.hasOutline
      ? (body.querySelector("#quickStripeAccentSizeSelect")?.value?.trim() || "")
      : "";

    addToCart(product.id, 1, {
      stripeWidths: widthValue ? [widthValue] : [],
      stripeColors: colorValue ? [colorValue] : [],
      stripeSpacings: spacingValue ? [spacingValue] : [],
      stripeOutlineColors: outlineValue ? [outlineValue] : [],
      stripeAccentStyles: accentStyleValue ? [accentStyleValue] : [],
      stripeAccentSizes: accentSizeValue ? [accentSizeValue] : []
    });
    closeStripeQuickModal();
  });

  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
}

function renderFlameQuickLivePreview(container, options) {
  const previewCanvas = container.querySelector("#flameQuickPreviewCanvas");
  const previewMeta = container.querySelector("#flameQuickPreviewMeta");
  const colorSelect = container.querySelector("#quickFlameColorSelect");

  if (!(previewCanvas && previewMeta && colorSelect)) return;
  let previewRequestId = 0;

  const update = () => {
    const requestId = ++previewRequestId;
    const selectedColor = colorSelect.value || options.colors[0] || "Gloss Black";
    const colorHex = stripeColorToHex(selectedColor);

    loadRacingStripePreviewSvg(options.previewSvgPath)
      .then((svgText) => {
        if (requestId !== previewRequestId) return;
        previewCanvas.innerHTML = renderDecalAssetPreview(svgText, colorHex, "Live flame preview");
      })
      .catch(() => {
        if (requestId !== previewRequestId) return;
        previewCanvas.innerHTML = `
          <div class="stripe-preview-surface" role="img" aria-label="Live flame preview">
            <svg class="stripe-preview-svg" viewBox="0 0 120 40" preserveAspectRatio="xMidYMid meet">
              <path d="M4 29 C22 10 34 34 49 13 C60 0 70 24 86 10 C98 2 105 18 116 8 C108 26 91 35 68 33 C46 32 27 38 4 29 Z" fill="${colorHex}" />
            </svg>
          </div>
        `;
      });

    previewMeta.textContent = `Color: ${selectedColor}`;
  };

  colorSelect.addEventListener("input", update);
  colorSelect.addEventListener("change", update);
  update();
}

function openFlameQuickModal(product) {
  const { modal, body, title } = getStripeQuickModalElements();
  if (!(modal && body && title)) return;

  const options = {
    colors: getDecalColorOptions(product),
    previewSvgPath: product?.svg_file_path || product?.svgFilePath || product?.previewSvgPath || "/assets/svg/flames/flames.svg"
  };

  currentStripeQuickProduct = product;
  title.textContent = product.name || "Flames Decal";
  const fullProductUrl = product.productUrl || `/product?id=${encodeURIComponent(product.id)}`;

  body.innerHTML = `
    <div class="stripe-quick-grid">
      <div class="product-option-grid">
        <label>
          Flame Color
          <select id="quickFlameColorSelect" aria-label="Flame color">
            ${options.colors.map((color) => `<option value="${color}">${color}</option>`).join("")}
          </select>
        </label>
      </div>

      <div class="stripe-live-preview stripe-live-preview--modal">
        <p class="stripe-live-preview__title">Live Preview</p>
        <div class="stripe-live-preview__canvas" id="flameQuickPreviewCanvas"></div>
        <p class="inline-note stripe-live-preview__meta" id="flameQuickPreviewMeta"></p>
      </div>
    </div>

    <div class="product-actions stripe-quick-actions">
      <a class="btn btn-outline" href="${fullProductUrl}">Open Full Product</a>
      <button type="button" class="btn" id="quickFlameAddToCartBtn">Add To Cart</button>
    </div>
  `;

  renderFlameQuickLivePreview(body, options);

  const addBtn = body.querySelector("#quickFlameAddToCartBtn");
  addBtn?.addEventListener("click", () => {
    const colorValue = body.querySelector("#quickFlameColorSelect")?.value?.trim() || "";
    addToCart(product.id, 1, {
      flameColors: colorValue ? [colorValue] : []
    });
    closeStripeQuickModal();
  });

  modal.removeAttribute("hidden");
  document.body.classList.add("modal-open");
}

function initStripeQuickModalEvents(productsEl) {
  const { modal, closeBtn } = getStripeQuickModalElements();
  if (!productsEl || !modal) return;

  productsEl.addEventListener('click', async (event) => {
    const customizeLink = event.target.closest('.quick-decal-customize-link, .racing-stripe-customize-link');
    if (!customizeLink) return;

    event.preventDefault();

    const productId = decodeURIComponent(String(customizeLink.dataset.productId || '').trim());
    const renderedProduct = currentRenderedProductsById.get(productId)
      || (typeof window.findProductById === 'function' ? window.findProductById(productId) : null);
    const productJsonRecord = await getProductJsonRecord(productId);
    const product = productJsonRecord
      ? { ...renderedProduct, ...productJsonRecord }
      : renderedProduct;

    if (!product) return;
    if (isRacingStripeProduct(product)) {
      openStripeQuickModal(product);
      return;
    }
    if (isFlameProduct(product)) {
      openFlameQuickModal(product);
    }
  });

  modal.addEventListener('click', (event) => {
    const closeTarget = event.target.closest('[data-modal-close="true"]');
    if (!closeTarget) return;
    closeStripeQuickModal();
  });

  closeBtn?.addEventListener('click', closeStripeQuickModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeStripeQuickModal();
    }
  });
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeFilterValue(value) {
  return slugify(value || "");
}

function normalizeCategory(value) {
  const normalized = normalizeText(value);

  if (!normalized) return "";
  if (normalized === "decals") return "Decals";
  if (normalized.startsWith("vehicle decals")) return "Decals";
  if (normalized === "stickers") return "Decals";
  if (normalized === "lettering") return "Lettering";
  if (normalized === "business lettering") return "Lettering";
  if (normalized === "wraps") return "Wraps";
  if (normalized === "wrap graphics") return "Wraps";
  if (normalized === "custom orders") return "Decals";

  return String(value || "").trim();
}

function normalizePlacement(value) {
  const text = normalizeText(value);

  if (!text) return "";

  if (text.includes("fender")) return "Fender";
  if (text.includes("full body") || text.includes("half body")) return "Full Body/Half Body";
  if (text.includes("hood")) return "Hood";
  if (text.includes("quarter")) return "Rear Quarter Panel";
  if (text.includes("rocker") || text.includes("side skirt") || text.includes("side")) return "Rocker Panel/Side";
  if (text.includes("windshield") || text.includes("rear window") || text.includes("banner")) return "Windshield/Rear Window";

  return "";
}

function normalizeType(value) {
  const text = normalizeText(value);

  if (!text) return "";

  if (text.includes("racing stripe") || text.includes("stripe")) return "Racing Stripes";
  if (text.includes("sponsor stack") || text.includes("sponsor row")) return "Sponsor Stacks/Rows";
  if (text.includes("geometrical") || text.includes("geometric") || text.includes("pattern")) return "Graphics";
  if (text.includes("platform")) return "Platform Specific";
  if (text.includes("brand") || text.includes("trd") || text.includes("mopar") || text.includes("coyote") || text.includes("nismo")) return "Brands";
  if (text.includes("rip") || text.includes("scratch") || text.includes("tear")) return "Graphics";
  if (text.includes("graphic") || text.includes("banner") || text.includes("letter")) return "Graphics";

  return "";
}

function normalizeGraphicsSubtype(value) {
  const text = normalizeText(value);

  if (text.includes("geometrical") || text.includes("geometric") || text.includes("pattern")) return "Geometrical Patterns";
  if (text.includes("rip") || text.includes("scratch") || text.includes("tear")) return "Rips/Scratches/Tears";

  return "";
}

function getProductPlacement(product) {
  return (
    product.placement ||
    normalizePlacement(product.subcategory) ||
    normalizePlacement(product.subSubcategory) ||
    normalizePlacement(product.name) ||
    normalizePlacement(product.description) ||
    ""
  );
}

function getProductType(product) {
  return (
    product.type ||
    product.style ||
    product.decalType ||
    normalizeType(product.subSubcategory) ||
    normalizeType(product.subcategory) ||
    normalizeType(product.name) ||
    normalizeType(product.description) ||
    ""
  );
}

function getProductGraphicsSubtype(product) {
  return (
    product.graphicsSubtype ||
    normalizeGraphicsSubtype(product.subSubcategory) ||
    normalizeGraphicsSubtype(product.subcategory) ||
    normalizeGraphicsSubtype(product.name) ||
    normalizeGraphicsSubtype(product.description) ||
    ""
  );
}

function isGenericImage(path) {
  return (
    !path ||
    path.includes("main.PNG") ||
    path.includes("main.png") ||
    path.includes("placeholder")
  );
}

function buildDecalProductImagePath(product) {
  const placement = getProductFolderSlug(product.placement || "custom", "placement");
  const type = getProductFolderSlug(product.decalType || product.type || product.style || "graphics", "type");
  const productSlug = product.slug || slugify(product.name || "product");

  return `${DECAL_IMAGE_BASE}/products/${placement}__${type}/${productSlug}.png`;
}

function getProductFolderSlug(value, group) {
  const label = String(value || "").trim();

  if (group === "type" && label === "Racing Stripes") return "stripes";
  if (group === "type" && label === "Sponsor Stacks/Rows") return "sponsor-stacks-rows";

  return slugify(label);
}

function getLegacyDecalImagePath(product) {
  const path = String(product.imagePath || "");
  if (!path.includes("/rocker_panel_side_stripes/")) return "";

  const fileName = path.split("/").pop();
  return `${DECAL_IMAGE_BASE}/products/rocker-panel-side__stripes/${fileName}`;
}

function getProductImage(product) {
  if (product.preview_image_path) {
    return product.preview_image_path;
  }

  const legacyPath = getLegacyDecalImagePath(product);
  if (legacyPath) return legacyPath;

  if (!isGenericImage(product.imagePath)) {
    return product.imagePath;
  }

  if (product.category === "Decals") {
    return buildDecalProductImagePath(product);
  }

  return (
    NON_DECAL_SUBCATEGORY_IMAGES[product.subcategory] ||
    CATEGORY_IMAGES[product.category] ||
    FALLBACK_IMAGE
  );
}

function toDisplayProduct(product) {
  const category = normalizeCategory(product.category);
  const placement = getProductPlacement(product);
  const decalType = getProductType(product);
  const graphicsSubtype = getProductGraphicsSubtype(product);

  let subcategory = product.subcategory || "";
  let subSubcategory = product.subSubcategory || "";

  if (category === "Decals") {
    if (!subcategory && placement) subcategory = placement;
    if (!subSubcategory && decalType) subSubcategory = decalType;
  }

  const displayProduct = {
    ...product,
    category,
    placement,
    decalType,
    graphicsSubtype,
    type: decalType,
    style: decalType,
    subcategory,
    subSubcategory
  };

  return {
    ...displayProduct,
    imagePath: getProductImage(displayProduct),
    imageLabel:
      product.imageLabel ||
      decalType ||
      placement ||
      subcategory ||
      category ||
      product.name
  };
}

function imageWithFallback(src, alt) {
  return `<img src="${src || FALLBACK_IMAGE}" alt="${alt || ""}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">`;
}

function createTaxonomyButton({ label, image, datasetName, datasetValue, active = false }) {
  const dataAttribute = String(datasetName || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();

  return `
    <button type="button" class="decal-chip taxonomy-card${active ? " active" : ""}" data-${dataAttribute}="${datasetValue}">
      ${imageWithFallback(image, label)}
      <span>${label}</span>
    </button>
  `;
}

async function initShop() {
  const productsEl = document.getElementById("shopProducts");
  const resultsMeta = document.getElementById("resultsMeta");

  const categoryPicks = document.getElementById("categoryPicks");
  const subcategoryWrap = document.getElementById("subcategoryWrap");
  const subcategoryPicks = document.getElementById("subcategoryPicks");
  const subcategoryDetailWrap = document.getElementById("subcategoryDetailWrap");
  const subcategoryDetailPicks = document.getElementById("subcategoryDetailPicks");

  const shopFiltersToggle = document.getElementById("shopFiltersToggle");
  const shopFiltersCard = document.getElementById("shopFiltersCard");

  const vehicleSearchInput = document.getElementById("vehicleSearchInput");
  const vehicleSearchOptions = document.getElementById("vehicleSearchOptions");
  const yearFilter = document.getElementById("yearFilter");
  const makeFilter = document.getElementById("makeFilter");
  const modelFilter = document.getElementById("modelFilter");
  const trimFilter = document.getElementById("trimFilter");

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const subcategoryFilter = document.getElementById("subcategoryFilter");
  const subcategoryDetailFilter = document.getElementById("subcategoryDetailFilter");
  const sortFilter = document.getElementById("sortFilter");
  const clearFilters = document.getElementById("clearFilters");

  initStripeQuickModalEvents(productsEl);

  if (!productsEl) return;

  if (typeof window.ensureProductsLoaded === "function") {
    await window.ensureProductsLoaded();
  }

  let activeDecalTab = "By Placement";
  let activeDecalFilter = "all";
  let activeGraphicsFilter = "All Graphics";

  function setShopFiltersVisibility(expanded) {
    if (!shopFiltersToggle || !shopFiltersCard) return;

    shopFiltersCard.hidden = !expanded;
    shopFiltersToggle.setAttribute("aria-expanded", String(expanded));
    shopFiltersToggle.textContent = expanded ? "Hide Filters" : "Filters & Sort";
  }

  function syncShopFiltersLayout() {
    if (!shopFiltersToggle || !shopFiltersCard || typeof window.matchMedia !== "function") return;

    const isCompact = window.matchMedia("(max-width: 980px)").matches;
    shopFiltersToggle.hidden = !isCompact;
    setShopFiltersVisibility(!isCompact);
  }

  if (shopFiltersToggle && shopFiltersCard) {
    shopFiltersToggle.addEventListener("click", () => {
      const isExpanded = shopFiltersToggle.getAttribute("aria-expanded") === "true";
      setShopFiltersVisibility(!isExpanded);
    });

    window.addEventListener("resize", syncShopFiltersLayout);
    syncShopFiltersLayout();
  }

  function setSelectOptions(select, values, allLabel) {
    if (!select) return;

    select.innerHTML = [
      `<option value="all">${allLabel}</option>`,
      ...values.map((value) => `<option value="${value}">${value}</option>`)
    ].join("");
  }

  function setVehicleSelectOptions(select, values, placeholder) {
    if (!select) return;

    select.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...values.map((value) => `<option value="${value}">${value}</option>`)
    ].join("");
  }

  function setDatalistOptions(list, values) {
    if (!list) return;
    list.innerHTML = values.map((value) => `<option value="${value}"></option>`).join("");
  }

  function getCategories() {
    const categories = [...new Set((window.PRODUCTS || PRODUCTS || [])
      .map((product) => normalizeCategory(product.category))
      .filter((category) => SHOP_CATEGORIES.includes(category)))];

    SHOP_CATEGORIES.forEach((category) => {
      if (!categories.includes(category)) categories.push(category);
    });

    return categories;
  }

  function syncCategorySelect() {
    if (!categoryFilter) return;
    setSelectOptions(categoryFilter, getCategories(), "All Categories");
  }

  function syncLegacySelects() {
    if (!categoryFilter || !subcategoryFilter || !subcategoryDetailFilter) return;

    const category = categoryFilter.value;

    if (category === "Decals") {
      setSelectOptions(subcategoryFilter, DECAL_GROUPS, "All Decal Groups");
      subcategoryFilter.value = activeDecalTab;

      setSelectOptions(subcategoryDetailFilter, DECAL_FILTERS[activeDecalTab], "All");
      subcategoryDetailFilter.value = activeDecalFilter;
      return;
    }

    if (category === "Lettering") {
      setSelectOptions(subcategoryFilter, ["Business Name", "Business Info"], "All Subcategories");
      setSelectOptions(subcategoryDetailFilter, [], "All Details");
      return;
    }

    if (category === "Wraps") {
      setSelectOptions(subcategoryFilter, ["Full Rolls", "By The Foot"], "All Subcategories");
      setSelectOptions(subcategoryDetailFilter, [], "All Details");
      return;
    }

    setSelectOptions(subcategoryFilter, [], "All Subcategories");
    setSelectOptions(subcategoryDetailFilter, [], "All Details");
  }

  function syncHierarchyVisibility() {
    const category = categoryFilter?.value || "all";
    const hasDecalDetails = category === "Decals" && (DECAL_FILTERS[activeDecalTab] || []).length > 0;

    if (subcategoryWrap) {
      subcategoryWrap.hidden = category === "all";
    }

    if (subcategoryDetailWrap) {
      subcategoryDetailWrap.hidden = !hasDecalDetails;
    }
  }

  function renderCategoryPicks() {
    if (!categoryPicks) return;

    const selectedCategory = categoryFilter?.value || "all";

    categoryPicks.innerHTML = getCategories().map((category) => {
      const label = category;
      const image = CATEGORY_IMAGES[category] || FALLBACK_IMAGE;

      return createTaxonomyButton({
        label,
        image,
        datasetName: "category",
        datasetValue: category,
        active: category === selectedCategory
      });
    }).join("");
  }

  function getDecalGroupImage(group) {
    if (group === "By Placement") return PLACEMENT_IMAGES["Fender"] || CATEGORY_IMAGES.Decals;
    if (group === "By Type") return TYPE_IMAGES["Graphics"] || CATEGORY_IMAGES.Decals;
    return CATEGORY_IMAGES.Decals;
  }

  function renderDecalTabs() {
    if (!subcategoryPicks || !categoryFilter) return;

    const category = categoryFilter.value;

    if (category !== "Decals") {
      renderNonDecalSubcategoryPicks();
      return;
    }

    subcategoryPicks.innerHTML = `
      <div class="decal-text-filter-row">
        ${DECAL_GROUPS.map((value) => {
          return `
            <button type="button" class="decal-text-filter${activeDecalTab === value ? " active" : ""}" data-decal-group="${value}">
              ${value}
            </button>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderNonDecalSubcategoryPicks() {
    if (!subcategoryPicks || !categoryFilter || !subcategoryFilter) return;

    const category = categoryFilter.value;

    if (category === "all" || category === "Decals") {
      subcategoryPicks.innerHTML = "";
      return;
    }

    let values = [];

    if (category === "Lettering") values = ["Business Name", "Business Info"];
    if (category === "Wraps") values = ["Full Rolls", "By The Foot"];

    const selected = subcategoryFilter.value || "all";

    subcategoryPicks.innerHTML = `
      <div class="decal-filter-card-grid">
        ${["all", ...values].map((value) => {
          const label = value === "all" ? "All" : value;
          const image = value === "all"
            ? CATEGORY_IMAGES[category] || FALLBACK_IMAGE
            : NON_DECAL_SUBCATEGORY_IMAGES[value] || FALLBACK_IMAGE;

          return createTaxonomyButton({
            label,
            image,
            datasetName: "subcategory",
            datasetValue: value,
            active: selected === value
          });
        }).join("")}
      </div>
    `;
  }

  function renderSubcategoryDetailPicks() {
    if (!subcategoryDetailPicks || !categoryFilter) return;

    const category = categoryFilter.value;
    const filters = DECAL_FILTERS[activeDecalTab] || [];

    if (category !== "Decals" || !filters.length) {
      subcategoryDetailPicks.innerHTML = "";
      return;
    }

    subcategoryDetailPicks.innerHTML = `
      <div class="decal-text-filter-row">
        <button type="button" class="decal-text-filter${activeDecalFilter === "all" ? " active" : ""}" data-decal-filter="all">
          All ${activeDecalTab.replace("By ", "")}
        </button>
      </div>
      <div class="decal-filter-card-grid ${activeDecalTab === "By Type" ? "is-type-grid" : "is-placement-grid"} is-compact${activeDecalFilter !== "all" ? " has-selection" : ""}">
        ${filters.map((value) => {
          const image = activeDecalTab === "By Placement"
            ? PLACEMENT_IMAGES[value]
            : TYPE_IMAGES[value];

          return createTaxonomyButton({
            label: value,
            image,
            datasetName: "decalFilter",
            datasetValue: value,
            active: activeDecalFilter === value
          });
        }).join("")}
      </div>
      ${activeDecalTab === "By Type" && activeDecalFilter === "Graphics" ? `
        <div class="decal-text-filter-row decal-subfilter-heading">
          <strong>Graphics Type</strong>
        </div>
        <div class="decal-filter-card-grid is-type-grid is-compact${activeGraphicsFilter !== "All Graphics" ? " has-selection" : ""}">
          ${GRAPHICS_FILTERS.map((value) => {
            return createTaxonomyButton({
              label: value,
              image: GRAPHICS_IMAGES[value],
              datasetName: "graphicsFilter",
              datasetValue: value,
              active: activeGraphicsFilter === value
            });
          }).join("")}
        </div>
      ` : ""}
    `;
  }

  function syncAllHierarchyUI() {
    syncLegacySelects();
    syncHierarchyVisibility();
    renderCategoryPicks();
    renderDecalTabs();
    renderSubcategoryDetailPicks();
  }

  function scrollToActiveSubcategories() {
    const category = categoryFilter?.value || "all";
    const target = category === "Decals" || category === "Lettering" || category === "Wraps"
      ? subcategoryWrap
      : productsEl;

    window.setTimeout(() => {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function scrollToProductsGrid() {
    window.setTimeout(() => {
      productsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function buildVehicleLabel(vehicle) {
    return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  }

  function getVehicleSearchLabel(vehicle) {
    return [buildVehicleLabel(vehicle), vehicle.bodyStyle].filter(Boolean).join(" ");
  }

  function buildVehicleCustomizeUrl(vehicle) {
    const params = new URLSearchParams();

    params.set("type", "vehicle-tint-kit");
    params.set("year", vehicle.year);
    params.set("make", vehicle.make);
    params.set("model", vehicle.model);

    if (vehicle.trim) params.set("trim", vehicle.trim);
    if (vehicle.kitSku) params.set("sku", vehicle.kitSku);

    return `/customize?${params.toString()}`;
  }

  function buildVehicleProductUrl(vehicle) {
    const params = new URLSearchParams();

    params.set("type", "vehicle-tint-kit");
    params.set("year", vehicle.year);
    params.set("make", vehicle.make);
    params.set("model", vehicle.model);

    if (vehicle.trim) params.set("trim", vehicle.trim);
    if (vehicle.kitSku) params.set("sku", vehicle.kitSku);

    return `/product?${params.toString()}`;
  }

  function createVehicleKitProducts(vehicles) {
    return [];
  }

  function matchesVehicleSearch(vehicle, query) {
    if (!query) return true;

    const terms = query.split(/\s+/).filter(Boolean);
    const haystack = normalizeText(vehicle.searchLabel || getVehicleSearchLabel(vehicle));

    return terms.every((term) => haystack.includes(term));
  }

  let vehicleCatalogIndex = {
    years: [],
    makes: {},
    models: {},
    trims: {},
    vehicles: []
  };

  try {
    const payload = typeof window.RMGApi?.getVehicleCatalog === "function"
      ? await window.RMGApi.getVehicleCatalog()
      : await fetch("/api/vehicles/catalog").then((response) => response.ok ? response.json() : null);

    if (payload && Array.isArray(payload.years) && payload.makes && payload.models) {
      vehicleCatalogIndex = {
        years: payload.years,
        makes: payload.makes || {},
        models: payload.models || {},
        trims: payload.trims || {},
        vehicles: Array.isArray(payload.vehicles) ? payload.vehicles : []
      };
    }
  } catch {
    vehicleCatalogIndex = {
      years: [],
      makes: {},
      models: {},
      trims: {},
      vehicles: []
    };
  }

  function getModelsForSelection(year, make) {
    if (!year || !make) return [];
    return vehicleCatalogIndex.models[`${year}|${normalizeText(make)}`] || [];
  }

  function getTrimsForSelection(year, make, model) {
    if (!year || !make || !model) return [];
    return vehicleCatalogIndex.trims[`${year}|${normalizeText(make)}|${normalizeText(model)}`] || [];
  }

  function updateVehicleSearchSuggestions() {
    if (!vehicleSearchInput || !vehicleSearchOptions) return;

    const year = yearFilter?.value || "";
    const make = makeFilter?.value || "";
    const model = modelFilter?.value || "";
    const trim = trimFilter?.value || "";
    const query = normalizeText(vehicleSearchInput.value);

    const suggestions = vehicleCatalogIndex.vehicles
      .filter((vehicle) => {
        if (year && vehicle.year !== year) return false;
        if (make && vehicle.make !== make) return false;
        if (model && vehicle.model !== model) return false;
        if (trim && vehicle.trim !== trim) return false;
        return matchesVehicleSearch(vehicle, query);
      })
      .slice(0, 20)
      .map(getVehicleSearchLabel);

    setDatalistOptions(vehicleSearchOptions, [...new Set(suggestions)]);
  }

  function syncFiltersFromVehicleSearch() {
    if (!vehicleSearchInput) return;

    const selectedLabel = normalizeText(vehicleSearchInput.value);
    if (!selectedLabel) return;

    const matchedVehicle = vehicleCatalogIndex.vehicles.find(
      (vehicle) =>
        normalizeText(getVehicleSearchLabel(vehicle)) === selectedLabel ||
        normalizeText(buildVehicleLabel(vehicle)) === selectedLabel
    );

    if (!matchedVehicle) return;

    yearFilter.value = matchedVehicle.year;

    setVehicleSelectOptions(makeFilter, vehicleCatalogIndex.makes[matchedVehicle.year] || [], "Select Make");
    makeFilter.disabled = false;
    makeFilter.value = matchedVehicle.make;

    setVehicleSelectOptions(modelFilter, getModelsForSelection(matchedVehicle.year, matchedVehicle.make), "Select Model");
    modelFilter.disabled = false;
    modelFilter.value = matchedVehicle.model;

    setVehicleSelectOptions(trimFilter, getTrimsForSelection(matchedVehicle.year, matchedVehicle.make, matchedVehicle.model), "Select Trim");
    trimFilter.disabled = false;
    trimFilter.value = matchedVehicle.trim || "";

    if (typeof window.setSelectedVehicle === "function") {
      window.setSelectedVehicle(matchedVehicle);
    }
  }

  function persistSelectedVehicleFromFilters(vehicles) {
    if (typeof window.setSelectedVehicle !== "function") return;

    const selectedYear = yearFilter?.value || "";
    const selectedMake = makeFilter?.value || "";
    const selectedModel = modelFilter?.value || "";
    const selectedTrim = trimFilter?.value || "";

    if (!(selectedYear && selectedMake && selectedModel)) return;

    const exact = vehicles.find((vehicle) => {
      if (vehicle.year !== selectedYear) return false;
      if (vehicle.make !== selectedMake) return false;
      if (vehicle.model !== selectedModel) return false;
      if (selectedTrim && vehicle.trim !== selectedTrim) return false;
      return true;
    });

    if (exact) {
      window.setSelectedVehicle(exact);
    }
  }

  function applyStoredVehicleSelection() {
    const selectedVehicle = typeof window.getSelectedVehicle === "function"
      ? window.getSelectedVehicle()
      : null;

    if (!(selectedVehicle && yearFilter && makeFilter && modelFilter && trimFilter)) return;
    if (!vehicleCatalogIndex.years.includes(selectedVehicle.year)) return;

    yearFilter.value = selectedVehicle.year;

    setVehicleSelectOptions(makeFilter, vehicleCatalogIndex.makes[selectedVehicle.year] || [], "Select Make");
    makeFilter.disabled = false;

    if (selectedVehicle.make) {
      makeFilter.value = selectedVehicle.make;
      setVehicleSelectOptions(modelFilter, getModelsForSelection(selectedVehicle.year, selectedVehicle.make), "Select Model");
      modelFilter.disabled = false;
    }

    if (selectedVehicle.model) {
      modelFilter.value = selectedVehicle.model;
      setVehicleSelectOptions(trimFilter, getTrimsForSelection(selectedVehicle.year, selectedVehicle.make, selectedVehicle.model), "Select Trim");
      trimFilter.disabled = false;
    }

    if (selectedVehicle.trim) {
      trimFilter.value = selectedVehicle.trim;
    }

    if (vehicleSearchInput && selectedVehicle.label) {
      vehicleSearchInput.value = selectedVehicle.label;
    }
  }

  if (yearFilter && makeFilter && modelFilter && trimFilter) {
    setVehicleSelectOptions(yearFilter, vehicleCatalogIndex.years, "Select Year");
    updateVehicleSearchSuggestions();

    yearFilter.addEventListener("change", () => {
      const year = yearFilter.value;
      const makes = year ? (vehicleCatalogIndex.makes[year] || []) : [];

      setVehicleSelectOptions(makeFilter, makes, "Select Make");
      setVehicleSelectOptions(modelFilter, [], "Select Model");
      setVehicleSelectOptions(trimFilter, [], "Select Trim");

      makeFilter.disabled = !year;
      modelFilter.disabled = true;
      trimFilter.disabled = true;

      updateVehicleSearchSuggestions();
      render();
    });

    makeFilter.addEventListener("change", () => {
      const year = yearFilter.value;
      const make = makeFilter.value;
      const models = getModelsForSelection(year, make);

      setVehicleSelectOptions(modelFilter, models, "Select Model");
      setVehicleSelectOptions(trimFilter, [], "Select Trim");

      modelFilter.disabled = !(year && make);
      trimFilter.disabled = true;

      updateVehicleSearchSuggestions();
      render();
    });

    modelFilter.addEventListener("change", () => {
      const year = yearFilter.value;
      const make = makeFilter.value;
      const model = modelFilter.value;
      const trims = getTrimsForSelection(year, make, model);

      setVehicleSelectOptions(trimFilter, trims, "Select Trim");
      trimFilter.disabled = !(year && make && model);

      updateVehicleSearchSuggestions();
      render();
    });

    trimFilter.addEventListener("change", () => {
      updateVehicleSearchSuggestions();
      render();
    });
  }

  if (vehicleSearchInput) {
    vehicleSearchInput.addEventListener("input", () => {
      updateVehicleSearchSuggestions();
      render();
    });

    vehicleSearchInput.addEventListener("change", () => {
      syncFiltersFromVehicleSearch();
      updateVehicleSearchSuggestions();
      render();
    });
  }

  applyStoredVehicleSelection();
  updateVehicleSearchSuggestions();

  syncCategorySelect();
  syncAllHierarchyUI();

  function productMatchesSearch(product, search) {
    if (!search) return true;

    const searchableText = [
      product.name,
      product.category,
      product.subcategory,
      product.subSubcategory,
      product.placement,
      product.type,
      product.style,
      product.decalType,
      product.description,
      ...(Array.isArray(product.tags) ? product.tags : [])
    ].join(" ").toLowerCase();

    return searchableText.includes(search);
  }

  function matchesDecalFilter(product) {
    if (activeDecalTab === "Custom") {
      return normalizeText(product.subcategory) === "custom" ||
        normalizeText(product.position) === "custom" ||
        normalizeText(product.subSubcategory) === "custom";
    }

    if (activeDecalFilter === "all") return true;

    if (activeDecalTab === "By Placement") {
      return normalizeFilterValue(product.placement || product.subcategory) === normalizeFilterValue(activeDecalFilter);
    }

    if (activeDecalTab === "By Type") {
      const activeType = normalizeFilterValue(activeDecalFilter);
      const productTypes = [
        product.decalType,
        product.type,
        product.style,
        product.subSubcategory
      ].map(normalizeFilterValue);

      const matchesType = productTypes.includes(activeType);
      if (!matchesType) return false;

      if (activeType === "graphics" && activeGraphicsFilter !== "All Graphics") {
        return normalizeFilterValue(product.graphicsSubtype) === normalizeFilterValue(activeGraphicsFilter);
      }

      return true;
    }

    return true;
  }

  function render() {
    const productsSource = typeof window.getProductsList === "function"
      ? window.getProductsList()
      : (window.PRODUCTS || PRODUCTS || []);
    const search = searchInput?.value.trim().toLowerCase() || "";
    const category = categoryFilter?.value || "all";
    const subcategory = subcategoryFilter?.value || "all";
    const sort = sortFilter?.value || "default";

    const vehicleQuery = normalizeText(vehicleSearchInput?.value || "");
    const selectedYear = yearFilter?.value || "";
    const selectedMake = makeFilter?.value || "";
    const selectedModel = modelFilter?.value || "";
    const selectedTrim = trimFilter?.value || "";

    const matchedVehicles = vehicleCatalogIndex.vehicles.filter((vehicle) => {
      if (selectedYear && vehicle.year !== selectedYear) return false;
      if (selectedMake && vehicle.make !== selectedMake) return false;
      if (selectedModel && vehicle.model !== selectedModel) return false;
      if (selectedTrim && vehicle.trim !== selectedTrim) return false;
      return matchesVehicleSearch(vehicle, vehicleQuery);
    });

    persistSelectedVehicleFromFilters(matchedVehicles);

    const vehicleKits = [];

    let filtered = productsSource.map(toDisplayProduct).filter((product) => {
      const matchesSearch = productMatchesSearch(product, search);
      const matchesCategory = category === "all" || product.category === category;
      const matchesStoreCategory = SHOP_CATEGORIES.includes(product.category);

      if (!matchesStoreCategory || !matchesSearch || !matchesCategory) return false;

      if (category === "Decals") {
        return matchesDecalFilter(product);
      }

      if (category !== "all" && subcategory !== "all") {
        return product.subcategory === subcategory;
      }

      return true;
    });

    if (vehicleKits.length) {
      const kitProducts = vehicleKits.map(toDisplayProduct).filter((product) => {
        const matchesSearch = productMatchesSearch(product, search);
        const matchesCategory = category === "all" || product.category === category;
        const matchesSubcategory = subcategory === "all" || product.subcategory === subcategory;

        return matchesSearch && matchesCategory && matchesSubcategory;
      });

      filtered = kitProducts.concat(filtered);
    }

    if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    if (sort === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));

    const vehicleSearchActive = Boolean(vehicleQuery || selectedYear || selectedMake || selectedModel || selectedTrim);
    const hierarchyActive = Boolean(category !== "all" || subcategory !== "all" || activeDecalFilter !== "all");

    const vehicleMeta = vehicleSearchActive
      ? ` • ${matchedVehicles.length} vehicle match${matchedVehicles.length !== 1 ? "es" : ""}`
      : "";

    const hierarchyMeta = hierarchyActive ? " • filters active" : "";

    if (resultsMeta) {
      resultsMeta.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found${vehicleMeta}${hierarchyMeta}`;
    }

    productsEl.innerHTML = filtered.length
      ? filtered.map(renderProductCard).join("")
      : '<div class="card empty-state">Nothing found.</div>';

    currentRenderedProductsById = new Map(
      filtered.map((product) => [String(product.id || "").trim(), product])
    );
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      if (categoryFilter.value === "Decals") {
        activeDecalTab = "By Placement";
        activeDecalFilter = "all";
        activeGraphicsFilter = "All Graphics";
      }

      syncAllHierarchyUI();
      render();
      scrollToActiveSubcategories();
    });
  }

  if (subcategoryFilter) {
    subcategoryFilter.addEventListener("change", () => {
      if (categoryFilter?.value === "Decals") {
        activeDecalTab = DECAL_GROUPS.includes(subcategoryFilter.value) ? subcategoryFilter.value : "By Placement";
        activeDecalFilter = "all";
        activeGraphicsFilter = "All Graphics";
      }

      syncAllHierarchyUI();
      render();
    });
  }

  if (subcategoryDetailFilter) {
    subcategoryDetailFilter.addEventListener("change", () => {
      if (categoryFilter?.value === "Decals") {
        activeDecalFilter = subcategoryDetailFilter.value || "all";
        activeGraphicsFilter = "All Graphics";
      }

      renderSubcategoryDetailPicks();
      render();

      if (activeDecalFilter !== "all") {
        productsEl?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  [searchInput, sortFilter]
    .filter(Boolean)
    .forEach((element) => element.addEventListener("input", render));

  if (categoryPicks) {
    categoryPicks.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-category]");
      if (!chip || !categoryFilter) return;

      categoryFilter.value = chip.dataset.category || "all";

      if (categoryFilter.value === "Decals") {
        activeDecalTab = "By Placement";
        activeDecalFilter = "all";
        activeGraphicsFilter = "All Graphics";
      }

      syncAllHierarchyUI();
      render();
      scrollToActiveSubcategories();
    });
  }

  if (subcategoryPicks) {
    subcategoryPicks.addEventListener("click", (event) => {
      const group = event.target.closest("[data-decal-group]");
      if (group) {
        activeDecalTab = group.dataset.decalGroup;
        activeDecalFilter = "all";
        activeGraphicsFilter = "All Graphics";

        if (subcategoryFilter) subcategoryFilter.value = activeDecalTab;
        if (subcategoryDetailFilter) subcategoryDetailFilter.value = "all";

        syncAllHierarchyUI();
        render();
        return;
      }

      const decalFilter = event.target.closest("[data-decal-filter]");
      if (decalFilter) {
        activeDecalFilter = decalFilter.dataset.decalFilter || "all";
        activeGraphicsFilter = "All Graphics";

        if (subcategoryDetailFilter) {
          subcategoryDetailFilter.value = activeDecalFilter;
        }

        renderSubcategoryDetailPicks();
        render();
        return;
      }

      const subcategoryChip = event.target.closest("[data-subcategory]");
      if (subcategoryChip && subcategoryFilter) {
        subcategoryFilter.value = subcategoryChip.dataset.subcategory || "all";
        renderNonDecalSubcategoryPicks();
        render();
      }
    });
  }

  if (subcategoryDetailPicks) {
    subcategoryDetailPicks.addEventListener("click", (event) => {
      const decalFilter = event.target.closest("[data-decal-filter]");
      if (!decalFilter) return;

      activeDecalFilter = decalFilter.dataset.decalFilter || "all";

      if (subcategoryDetailFilter) {
        subcategoryDetailFilter.value = activeDecalFilter;
      }

      renderSubcategoryDetailPicks();
      render();
      scrollToProductsGrid();
    });
  }

  if (subcategoryDetailPicks) {
    subcategoryDetailPicks.addEventListener("click", (event) => {
      const graphicsFilter = event.target.closest("[data-graphics-filter]");
      if (!graphicsFilter) return;

      activeGraphicsFilter = graphicsFilter.dataset.graphicsFilter || "All Graphics";

      renderSubcategoryDetailPicks();
      render();
      scrollToProductsGrid();
    });
  }

  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      if (vehicleSearchInput) vehicleSearchInput.value = "";
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "all";
      if (subcategoryFilter) subcategoryFilter.value = "all";
      if (subcategoryDetailFilter) subcategoryDetailFilter.value = "all";
      if (sortFilter) sortFilter.value = "default";

      activeDecalTab = "By Placement";
      activeDecalFilter = "all";
      activeGraphicsFilter = "All Graphics";

      if (yearFilter && makeFilter && modelFilter && trimFilter) {
        yearFilter.value = "";

        setVehicleSelectOptions(makeFilter, [], "Select Make");
        setVehicleSelectOptions(modelFilter, [], "Select Model");
        setVehicleSelectOptions(trimFilter, [], "Select Trim");

        makeFilter.disabled = true;
        modelFilter.disabled = true;
        trimFilter.disabled = true;
      }

      if (typeof window.setSelectedVehicle === "function") {
        window.setSelectedVehicle(null);
      }

      syncAllHierarchyUI();
      updateVehicleSearchSuggestions();
      render();
    });
  }

  render();
}

document.addEventListener("DOMContentLoaded", initShop);
