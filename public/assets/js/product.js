function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function createVehicleKitFromQuery() {
  const type = getQueryParam('type');
  if (type !== 'vehicle-tint-kit') return null;

  const year = getQueryParam('year');
  const make = getQueryParam('make');
  const model = getQueryParam('model');
  const trim = getQueryParam('trim') || '';
  const kitSku = getQueryParam('sku') || '';

  if (!(year && make && model)) return null;

  const label = [year, make, model, trim].filter(Boolean).join(' ');
  const query = new URLSearchParams({
    type,
    year,
    make,
    model,
    ...(trim ? { trim } : {}),
    ...(kitSku ? { sku: kitSku } : {})
  }).toString();

  return {
    id: `vehicle-tint-kit-${(kitSku || label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: `${label} Film Kit`,
    slug: `${label} Film Kit`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    category: 'Film Kits',
    subcategory: 'Precut Kits',
    subSubcategory: null,
    price: 149.99,
    tags: ['Film Kits', 'Precut Kits'].concat(kitSku ? [kitSku] : []),
    description: `Pre-cut film kit matched for ${label}.`,
    imagePath: '/assets/imgs/main.PNG',
    imageLabel: `${label} Film Kit`,
    featured: false,
    custom: true,
    customizeUrl: `customize.html?${query}`,
    selectedVehicle: { year, make, model, trim, kitSku, label }
  };
}

function renderVehicleContextNote() {
  const vehicle = typeof window.getSelectedVehicle === 'function' ? window.getSelectedVehicle() : null;
  if (!vehicle || !vehicle.label) return '';
  return `<p class="inline-note">Selected vehicle: ${vehicle.label}${vehicle.kitSku ? ` (${vehicle.kitSku})` : ''}</p>`;
}

function isRacingStripeProduct(product) {
  if (!product) return false;
  if (String(product.subcategory || '').toLowerCase() === 'racing stripes') return true;
  if (String(product.subSubcategory || '').toLowerCase() === 'racing stripes') return true;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  return tags.some(tag => String(tag || '').toLowerCase() === 'racing stripes');
}

function inferMultipleStripeLayout(product, widths) {
  if (typeof product?.stripeOptions?.hasMultipleStripes === 'boolean') {
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
    .join(' ')
    .toLowerCase();

  return (
    searchable.includes('dual')
    || searchable.includes('double')
    || searchable.includes('multi')
    || searchable.includes('staggered')
    || searchable.includes('pinstripe')
    || searchable.includes('center +')
    || searchable.includes('/')
    || searchable.includes('pair')
  );
}

function inferOutlinedStripe(product, outlineColors) {
  if (typeof product?.stripeOptions?.hasOutline === 'boolean') {
    return product.stripeOptions.hasOutline;
  }

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return outlineColors.length > 0 || searchable.includes('outline') || searchable.includes('outlined');
}

function inferTopStripe(product) {
  if (typeof product?.stripeOptions?.hasTopStripe === 'boolean') {
    return product.stripeOptions.hasTopStripe;
  }

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchable.includes('dual top outlined');
}

const RACING_STRIPE_PREVIEW_BASE = '/assets/imgs/previews/racing-stripes';
const racingStripePreviewSvgCache = new Map();

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
    .join(' ')
    .toLowerCase();

  if (searchable.includes('staggered')) return `${RACING_STRIPE_PREVIEW_BASE}/staggered-stripes.svg`;
  if (searchable.includes('dual top outlined')) return `${RACING_STRIPE_PREVIEW_BASE}/dual-top-outlined-stripes.svg`;
  if (searchable.includes('outlined single') || searchable.includes('single outlined')) return `${RACING_STRIPE_PREVIEW_BASE}/single-outlined-stripe.svg`;
  if (searchable.includes('dual') || searchable.includes('double')) return `${RACING_STRIPE_PREVIEW_BASE}/dual-stripes.svg`;
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

function colorizeRacingStripeSvg(svgText, stripeColorHex, outlineColorHex) {
  return String(svgText || '')
    .replace(/<\?xml[^>]*>\s*/i, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace(/<svg\b/, '<svg x="28" y="39" width="484" height="54" class="stripe-preview-svg" preserveAspectRatio="xMidYMid meet"')
    .replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, `fill:${stripeColorHex}`)
    .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/g, `stroke:${outlineColorHex}`);
}

function renderRacingStripePreviewShell(contentMarkup, gradientId) {
  return `
    <svg viewBox="0 0 540 132" role="img" aria-label="Live stripe preview">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1520"/>
          <stop offset="100%" stop-color="#1f2e39"/>
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="524" height="116" rx="10" fill="url(#${gradientId})" />
      ${contentMarkup}
    </svg>
  `;
}

function renderStripeGeometryPreview({ selectedWidth, selectedSpacing, stripeColorHex, outlineColorHex, hasMultipleStripes, hasOutline, hasTopStripe, isRockerStripe }) {
  const stripeWidths = parseStripeWidths(selectedWidth, hasMultipleStripes);
  const spacingInches = parseInchValue(selectedSpacing, 0.5);
  const pixelsPerInch = isRockerStripe ? 4 : 7;
  const centerX = 270;
  const stripeHeight = isRockerStripe
    ? Math.min(18, Math.max(8, stripeWidths[0] * pixelsPerInch))
    : hasTopStripe ? 22 : 28;
  const stripeY = isRockerStripe ? 56 : hasTopStripe ? 62 : 52;
  const maxStripeWidth = hasMultipleStripes ? 82 : 126;
  const rects = [];

  if (isRockerStripe) {
    const stripeLength = 426;
    const x = (540 - stripeLength) / 2;
    const gap = hasMultipleStripes ? Math.min(18, Math.max(5, spacingInches * 9)) : 0;
    const bandCount = hasMultipleStripes ? 2 : 1;
    const totalHeight = bandCount * stripeHeight + (bandCount - 1) * gap;
    const startY = 66 - totalHeight / 2;

    for (let index = 0; index < bandCount; index += 1) {
      rects.push({
        x,
        y: startY + index * (stripeHeight + gap),
        width: stripeLength,
        height: stripeHeight
      });
    }

    if (hasTopStripe) {
      const accentHeight = Math.max(4, Math.round(stripeHeight * 0.36));
      rects.push({
        x,
        y: Math.max(24, startY - accentHeight - 7),
        width: stripeLength,
        height: accentHeight
      });
    }

    return rects.map((rect, index) => {
      const stroke = hasOutline || (hasTopStripe && index === rects.length - 1)
        ? ` stroke="${outlineColorHex}" stroke-width="4" paint-order="stroke fill"`
        : '';
      return `<rect x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${rect.height}" rx="2" fill="${stripeColorHex}"${stroke} />`;
    }).join('');
  }

  if (hasMultipleStripes) {
    const leftWidth = Math.min(maxStripeWidth, Math.max(20, stripeWidths[0] * pixelsPerInch));
    const rightWidth = Math.min(maxStripeWidth, Math.max(20, stripeWidths[1] * pixelsPerInch));
    const gap = Math.min(40, Math.max(8, spacingInches * pixelsPerInch));
    const total = leftWidth + rightWidth + gap;
    rects.push({ x: centerX - total / 2, y: stripeY, width: leftWidth, height: stripeHeight });
    rects.push({ x: centerX - total / 2 + leftWidth + gap, y: stripeY, width: rightWidth, height: stripeHeight });
  } else {
    const width = Math.min(maxStripeWidth, Math.max(28, stripeWidths[0] * pixelsPerInch));
    rects.push({ x: centerX - width / 2, y: stripeY, width, height: stripeHeight });
  }

  if (hasTopStripe) {
    const topHeight = 8;
    const topGap = 8;
    rects.push(...rects.slice(0, hasMultipleStripes ? 2 : 1).map((rect) => ({
      ...rect,
      y: stripeY - topHeight - topGap,
      height: topHeight
    })));
  }

  return rects.map((rect) => {
    const stroke = hasOutline ? ` stroke="${outlineColorHex}" stroke-width="5" paint-order="stroke fill"` : '';
    return `<rect x="${rect.x.toFixed(1)}" y="${rect.y.toFixed(1)}" width="${rect.width.toFixed(1)}" height="${rect.height}" rx="2" fill="${stripeColorHex}"${stroke} />`;
  }).join('');
}

function getRacingStripeOptions(product) {
  const subcategory = String(product?.subcategory || '').toLowerCase();
  const widthFallback = subcategory.includes('rocker')
    ? ['3 in', '4 in', '5 in', '6 in']
    : ['8 in / 8 in', '10 in / 10 in', '12 in / 12 in', '10 in center + 2 in pinstripes'];

  const widthOptions = Array.isArray(product?.stripeOptions?.widths)
    ? product.stripeOptions.widths
    : widthFallback;
  const colorOptions = Array.isArray(product?.stripeOptions?.colors)
    ? product.stripeOptions.colors
    : ['Gloss Black', 'Matte Black', 'Satin Charcoal', 'Gloss White', 'Race Red', 'Nardo Gray'];

  const spacingOptions = Array.isArray(product?.stripeOptions?.spacings)
    ? product.stripeOptions.spacings
    : ['0.25 in', '0.5 in', '0.75 in', '1.0 in', '1.5 in'];

  const explicitOutlineColors = Array.isArray(product?.stripeOptions?.outlineColors)
    ? product.stripeOptions.outlineColors
    : [];
  const fallbackOutlineColors = ['Gloss Black', 'Matte Black', 'Gloss White', 'Race Red', 'Nardo Gray'];

  const widths = widthOptions.map(value => String(value || '').trim()).filter(Boolean);
  const colors = colorOptions.map(value => String(value || '').trim()).filter(Boolean);
  const spacings = spacingOptions.map(value => String(value || '').trim()).filter(Boolean);
  const explicitOutlineColorValues = explicitOutlineColors.map(value => String(value || '').trim()).filter(Boolean);

  const hasMultipleStripes = inferMultipleStripeLayout(product, widths);
  const hasOutline = inferOutlinedStripe(product, explicitOutlineColorValues);
  const hasTopStripe = inferTopStripe(product);
  const outlineColors = (explicitOutlineColorValues.length ? explicitOutlineColorValues : fallbackOutlineColors);

  return {
    widths,
    colors,
    spacings,
    outlineColors,
    hasMultipleStripes,
    hasOutline,
    hasTopStripe,
    previewSvgPath: getRacingStripePreviewSvgPath(product)
  };
}

function renderRacingStripeOptions(product) {
  if (!isRacingStripeProduct(product)) return '';

  const options = getRacingStripeOptions(product);
  if (!options.widths.length || !options.colors.length) return '';

  const spacingMarkup = options.hasMultipleStripes && options.spacings.length
    ? `
      <label>
        Stripe Spacing
        <select id="stripeSpacingSelect" aria-label="Stripe spacing">
          ${options.spacings.map(spacing => `<option value="${spacing}">${spacing}</option>`).join('')}
        </select>
      </label>
    `
    : '';

  const outlineMarkup = options.hasOutline && options.outlineColors.length
    ? `
      <label>
        Outline Color
        <select id="stripeOutlineColorSelect" aria-label="Stripe outline color">
          ${options.outlineColors.map(color => `<option value="${color}">${color}</option>`).join('')}
        </select>
      </label>
    `
    : '';

  return `
    <div class="product-option-grid">
      <label>
        Stripe Width
        <select id="stripeWidthSelect" aria-label="Stripe width">
          ${options.widths.map(width => `<option value="${width}">${width}</option>`).join('')}
        </select>
      </label>
      <label>
        Stripe Color
        <select id="stripeColorSelect" aria-label="Stripe color">
          ${options.colors.map(color => `<option value="${color}">${color}</option>`).join('')}
        </select>
      </label>
      ${spacingMarkup}
      ${outlineMarkup}
    </div>
  `;
}

function getSelectedRacingStripeOptions(container, product) {
  if (!isRacingStripeProduct(product)) return null;

  const options = getRacingStripeOptions(product);
  const widthValue = container.querySelector('#stripeWidthSelect')?.value?.trim();
  const colorValue = container.querySelector('#stripeColorSelect')?.value?.trim();
  const spacingValue = options.hasMultipleStripes
    ? container.querySelector('#stripeSpacingSelect')?.value?.trim()
    : '';
  const outlineColorValue = options.hasOutline
    ? container.querySelector('#stripeOutlineColorSelect')?.value?.trim()
    : '';

  return {
    stripeWidths: widthValue ? [widthValue] : [],
    stripeColors: colorValue ? [colorValue] : [],
    stripeSpacings: spacingValue ? [spacingValue] : [],
    stripeOutlineColors: outlineColorValue ? [outlineColorValue] : []
  };
}

function parseInchValue(input, fallback) {
  const match = String(input || '').match(/\d+(?:\.\d+)?/);
  if (!match) return fallback;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseStripeWidths(widthLabel, hasMultipleStripes) {
  const label = String(widthLabel || '');
  const values = label.match(/\d+(?:\.\d+)?/g) || [];
  const parsed = values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);

  if (!hasMultipleStripes) {
    return [parsed[0] || 4];
  }

  if (parsed.length >= 2) return [parsed[0], parsed[1]];
  const fallback = parsed[0] || 4;
  return [fallback, fallback];
}

function stripeColorToHex(colorValue) {
  const name = String(colorValue || '').trim().toLowerCase();
  const palette = {
    'gloss black': '#111111',
    'matte black': '#2a2a2a',
    'satin charcoal': '#4e545c',
    'gloss white': '#f5f5f5',
    'race red': '#cf1f2b',
    'nardo gray': '#9ca1a6'
  };

  if (palette[name]) return palette[name];
  if (/^#([a-f0-9]{3}|[a-f0-9]{6})$/i.test(colorValue || '')) return colorValue;
  return '#111111';
}

function renderRacingStripeLivePreview(container, product) {
  const options = getRacingStripeOptions(product);
  const isRockerStripe = String(product?.subcategory || '').toLowerCase().includes('rocker');
  const previewCanvas = container.querySelector('#stripeLivePreviewCanvas');
  const previewMeta = container.querySelector('#stripeLivePreviewMeta');
  const widthSelect = container.querySelector('#stripeWidthSelect');
  const colorSelect = container.querySelector('#stripeColorSelect');
  const spacingSelect = container.querySelector('#stripeSpacingSelect');
  const outlineColorSelect = container.querySelector('#stripeOutlineColorSelect');

  if (!(previewCanvas && previewMeta && widthSelect && colorSelect)) return;
  let previewRequestId = 0;

  const update = () => {
    const requestId = ++previewRequestId;
    const selectedWidth = widthSelect.value || options.widths[0] || '4 in';
    const selectedColor = colorSelect.value || options.colors[0] || 'Gloss Black';
    const selectedSpacing = spacingSelect?.value || options.spacings[0] || '0.5 in';
    const selectedOutline = outlineColorSelect?.value || options.outlineColors[0] || 'Gloss White';

    const stripeColorHex = stripeColorToHex(selectedColor);
    const outlineColorHex = options.hasOutline ? stripeColorToHex(selectedOutline) : stripeColorHex;
    const geometryPreview = renderStripeGeometryPreview({
      selectedWidth,
      selectedSpacing,
      stripeColorHex,
      outlineColorHex,
      hasMultipleStripes: options.hasMultipleStripes,
      hasOutline: options.hasOutline,
      hasTopStripe: options.hasTopStripe,
      isRockerStripe
    });

    previewCanvas.innerHTML = renderRacingStripePreviewShell(geometryPreview, 'stripePreviewBg');
    if (options.previewSvgPath) {
      loadRacingStripePreviewSvg(options.previewSvgPath)
        .then((svgText) => {
          if (requestId !== previewRequestId) return;
          previewCanvas.innerHTML = renderRacingStripePreviewShell(
            colorizeRacingStripeSvg(svgText, stripeColorHex, outlineColorHex),
            'stripePreviewBg'
          );
        })
        .catch(() => {
          if (requestId !== previewRequestId) return;
          previewCanvas.innerHTML = renderRacingStripePreviewShell(geometryPreview, 'stripePreviewBg');
        });
    }

    const metaParts = [
      `Width: ${selectedWidth}`,
      `Color: ${selectedColor}`
    ];
    if (options.hasMultipleStripes) metaParts.push(`Spacing: ${selectedSpacing}`);
    if (options.hasOutline) metaParts.push(`Outline: ${selectedOutline}`);
    previewMeta.textContent = metaParts.join(' • ');
  };

  [widthSelect, colorSelect, spacingSelect, outlineColorSelect].forEach((input) => {
    if (!input) return;
    input.addEventListener('change', update);
    input.addEventListener('input', update);
  });

  update();
}

async function initProductPage() {
  const container = document.getElementById('productDetails');
  const related = document.getElementById('relatedProducts');
  if (!container) return;

  if (typeof window.ensureProductsLoaded === 'function') {
    await window.ensureProductsLoaded();
  }

  const vehicleKitProduct = createVehicleKitFromQuery();
  const id = getQueryParam('id');
  const products = typeof window.getProductsList === 'function'
    ? window.getProductsList()
    : (Array.isArray(window.PRODUCTS) ? window.PRODUCTS : (typeof PRODUCTS !== 'undefined' ? PRODUCTS : []));
  const product = vehicleKitProduct || findProductById(id) || products[0];

  if (vehicleKitProduct?.selectedVehicle && typeof window.setSelectedVehicle === 'function') {
    window.setSelectedVehicle(vehicleKitProduct.selectedVehicle);
  }

  if (window.RMGAnalytics?.trackProductView) {
    window.RMGAnalytics.trackProductView(product);
  }

  const imagePath = product.preview_image_path || product.imagePath || '/assets/imgs/main.PNG';
  const imageAlt = product.imageLabel || product.name || 'Product preview';
  const isRacingStripe = isRacingStripeProduct(product);
  const customizeUrl = typeof window.buildCustomizeUrl === 'function'
    ? window.buildCustomizeUrl(product)
    : (product.customizeUrl || `customize.html?productId=${encodeURIComponent(product.id)}`);
  const optionsMarkup = isRacingStripe ? renderRacingStripeOptions(product) : '';
  const isCustomizable = Boolean(product.customizable ?? product.custom);
  const actions = isCustomizable
    ? `
        <a class="btn" href="${customizeUrl}">Customize</a>
        <a class="btn btn-outline" href="shop.html">Continue Shopping</a>
      `
    : `
        <button class="btn" id="productAddToCartBtn">Add to Cart</button>
      `;

  container.innerHTML = `
    <div class="product-detail">
      <div class="product-gallery">
        <img src="${imagePath}" alt="${imageAlt}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <span class="media-fallback">${imageAlt}</span>
      </div>
      <div class="card">
        <p class="eyebrow">${product.category}</p>
        <h1>${product.name}</h1>
        <p class="price-xl">${formatCurrency(product.price)}</p>
        <p>${product.description}</p>
        ${optionsMarkup}
        ${isRacingStripe ? `
          <div class="stripe-live-preview">
            <p class="stripe-live-preview__title">Live Preview</p>
            <div class="stripe-live-preview__canvas" id="stripeLivePreviewCanvas"></div>
            <p class="inline-note stripe-live-preview__meta" id="stripeLivePreviewMeta"></p>
          </div>
        ` : ''}
        ${renderVehicleContextNote()}
        <p class="inline-note">Use the decal editor to place this design on a vehicle mockup before checkout.</p>
        <div class="product-actions">
          ${actions}
        </div>
      </div>
    </div>
  `;

  if (related) {
    related.innerHTML = products.filter(item => item.id !== product.id).slice(0, 3).map(renderProductCard).join('');
  }

  if (isRacingStripe) {
    renderRacingStripeLivePreview(container, product);
  }

  const addToCartButton = container.querySelector('#productAddToCartBtn');

  if (addToCartButton) {
    addToCartButton.addEventListener('click', () => {
      const selectedOptions = getSelectedRacingStripeOptions(container, product);
      addToCart(product.id, 1, selectedOptions);
    });
  }
}

document.addEventListener('DOMContentLoaded', initProductPage);
