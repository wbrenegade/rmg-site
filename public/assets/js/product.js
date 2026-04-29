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

  if (outlineColors.length) return true;

  const searchable = [
    product?.name,
    product?.slug,
    product?.id,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchable.includes('outline') || searchable.includes('outlined');
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

  const outlineColorOptions = Array.isArray(product?.stripeOptions?.outlineColors)
    ? product.stripeOptions.outlineColors
    : ['Gloss Black', 'Matte Black', 'Gloss White', 'Race Red', 'Nardo Gray'];

  const widths = widthOptions.map(value => String(value || '').trim()).filter(Boolean);
  const colors = colorOptions.map(value => String(value || '').trim()).filter(Boolean);
  const spacings = spacingOptions.map(value => String(value || '').trim()).filter(Boolean);
  const outlineColors = outlineColorOptions.map(value => String(value || '').trim()).filter(Boolean);

  const hasMultipleStripes = inferMultipleStripeLayout(product, widths);
  const hasOutline = inferOutlinedStripe(product, outlineColors);
  const hasTopStripe = inferTopStripe(product);

  return {
    widths,
    colors,
    spacings,
    outlineColors,
    hasMultipleStripes,
    hasOutline,
    hasTopStripe
  };
}

function renderRacingStripeOptions(product) {
  if (!isRacingStripeProduct(product) || product.custom) return '';

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
  if (!isRacingStripeProduct(product) || product.custom) return null;

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
  const previewCanvas = container.querySelector('#stripeLivePreviewCanvas');
  const previewMeta = container.querySelector('#stripeLivePreviewMeta');
  const widthSelect = container.querySelector('#stripeWidthSelect');
  const colorSelect = container.querySelector('#stripeColorSelect');
  const spacingSelect = container.querySelector('#stripeSpacingSelect');
  const outlineColorSelect = container.querySelector('#stripeOutlineColorSelect');

  if (!(previewCanvas && previewMeta && widthSelect && colorSelect)) return;

  const update = () => {
    const selectedWidth = widthSelect.value || options.widths[0] || '4 in';
    const selectedColor = colorSelect.value || options.colors[0] || 'Gloss Black';
    const selectedSpacing = spacingSelect?.value || options.spacings[0] || '0.5 in';
    const selectedOutline = outlineColorSelect?.value || options.outlineColors[0] || 'Gloss White';

    const stripeWidths = parseStripeWidths(selectedWidth, options.hasMultipleStripes);
    const spacingInches = parseInchValue(selectedSpacing, 0.5);

    const stripeColorHex = stripeColorToHex(selectedColor);
    const outlineColorHex = stripeColorToHex(selectedOutline);
    const laneHeight = 112;
    const gapPx = options.hasMultipleStripes ? Math.max(8, Math.min(30, spacingInches * 18)) : 0;

    const pxPerInch = 2.2;
    let stripeHeights = stripeWidths.map((value) => Math.max(8, Math.round(value * pxPerInch)));

    const maxStripeAreaHeight = Math.max(24, laneHeight - (options.hasMultipleStripes ? gapPx : 0) - 20);
    const currentStripeHeightTotal = stripeHeights.reduce((sum, value) => sum + value, 0);
    if (currentStripeHeightTotal > maxStripeAreaHeight) {
      const scale = maxStripeAreaHeight / currentStripeHeightTotal;
      stripeHeights = stripeHeights.map((value) => Math.max(6, Math.round(value * scale)));
    }

    const totalStripeHeight = stripeHeights.reduce((sum, value) => sum + value, 0) + gapPx;
    let top = Math.max(10, Math.round((laneHeight - totalStripeHeight) / 2));

    const outlinePadding = options.hasOutline ? 3 : 0;
    const stripeRects = stripeHeights.map((height, index) => {
      const rect = {
        y: top,
        height
      };

      top += height;
      if (index === 0 && options.hasMultipleStripes) top += gapPx;
      return rect;
    });

    const topStripeMarkup = options.hasTopStripe && stripeRects[0]
      ? `<rect x="28" y="${Math.max(10, stripeRects[0].y - 9)}" width="484" height="4" rx="2" fill="${outlineColorHex}" />`
      : '';

    const stripesMarkup = stripeRects.map((rect) => {
      const outlineRect = options.hasOutline
        ? `<rect x="22" y="${rect.y - outlinePadding}" width="496" height="${rect.height + outlinePadding * 2}" rx="3" fill="${outlineColorHex}" />`
        : '';

      return `${outlineRect}<rect x="28" y="${rect.y}" width="484" height="${rect.height}" rx="2" fill="${stripeColorHex}" />`;
    }).join('');

    previewCanvas.innerHTML = `
      <svg viewBox="0 0 540 132" role="img" aria-label="Live stripe preview">
        <defs>
          <linearGradient id="stripePreviewBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f1520"/>
            <stop offset="100%" stop-color="#1f2e39"/>
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="524" height="116" rx="10" fill="url(#stripePreviewBg)" />
        ${topStripeMarkup}
        ${stripesMarkup}
      </svg>
    `;

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
  const product = vehicleKitProduct || findProductById(id) || PRODUCTS[0];

  if (vehicleKitProduct?.selectedVehicle && typeof window.setSelectedVehicle === 'function') {
    window.setSelectedVehicle(vehicleKitProduct.selectedVehicle);
  }

  if (window.RMGAnalytics?.trackProductView) {
    window.RMGAnalytics.trackProductView(product);
  }

  const imagePath = product.imagePath || '/assets/imgs/main.PNG';
  const imageAlt = product.imageLabel || product.name || 'Product preview';
  const customizeUrl = typeof window.buildCustomizeUrl === 'function'
    ? window.buildCustomizeUrl(product)
    : (product.customizeUrl || `customize.html?productId=${encodeURIComponent(product.id)}`);
  const optionsMarkup = renderRacingStripeOptions(product);
  const actions = product.custom
    ? `
        <a class="btn" href="${customizeUrl}">Customize</a>
        <a class="btn btn-outline" href="shop.html">Continue Shopping</a>
      `
    : `
        <button class="btn" id="productAddToCartBtn">Add to Cart</button>
        <a class="btn btn-outline" href="${customizeUrl}">Customize</a>
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
        <div class="stripe-live-preview" id="stripeLivePreview" ${isRacingStripeProduct(product) && !product.custom ? '' : 'hidden'}>
          <p class="stripe-live-preview__title">Live Preview</p>
          <div class="stripe-live-preview__canvas" id="stripeLivePreviewCanvas"></div>
          <p class="inline-note stripe-live-preview__meta" id="stripeLivePreviewMeta"></p>
        </div>
        ${renderVehicleContextNote()}
        <p class="inline-note">Use Customize to dial in stripe width, color, spacing, and outline options before checkout.</p>
        <div class="product-actions">
          ${actions}
        </div>
      </div>
    </div>
  `;

  if (related) {
    related.innerHTML = PRODUCTS.filter(item => item.id !== product.id).slice(0, 3).map(renderProductCard).join('');
  }

  const addToCartButton = container.querySelector('#productAddToCartBtn');
  if (isRacingStripeProduct(product) && !product.custom) {
    renderRacingStripeLivePreview(container, product);
  }

  if (addToCartButton) {
    addToCartButton.addEventListener('click', () => {
      const selectedOptions = getSelectedRacingStripeOptions(container, product);
      addToCart(product.id, 1, selectedOptions);
    });
  }
}

document.addEventListener('DOMContentLoaded', initProductPage);
