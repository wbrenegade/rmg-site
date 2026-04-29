const CUSTOMIZER_DEFAULT_VIEWS = {
  side: '/assets/imgs/previews/customizer/side.png',
  front: '/assets/imgs/previews/customizer/front.png',
  rear: '/assets/imgs/previews/customizer/rear.png'
};

const RACING_STRIPE_PREVIEW_BASE = '/assets/imgs/previews/racing-stripes';
const svgCache = new Map();

function getCustomizeParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function titleCase(value) {
  return String(value || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getVehicleFromCustomizeQuery() {
  const params = new URLSearchParams(window.location.search);
  const year = params.get('year');
  const make = params.get('make');
  const model = params.get('model');
  const trim = params.get('trim') || '';
  const kitSku = params.get('sku') || '';

  if (!(year && make && model)) return null;

  return {
    year,
    make,
    model,
    trim,
    kitSku,
    label: [year, make, model, trim].filter(Boolean).join(' ')
  };
}

function createVehicleKitFromCustomizeQuery() {
  const type = getCustomizeParam('type');
  if (type !== 'vehicle-tint-kit') return null;

  const vehicle = getVehicleFromCustomizeQuery();
  if (!vehicle) return null;

  const label = vehicle.label;
  return {
    id: `vehicle-tint-kit-${(vehicle.kitSku || label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: `${label} Tint Kit`,
    category: 'Tint Kits',
    subcategory: 'Precut Kits',
    subSubcategory: null,
    price: 149.99,
    tags: ['Tint Kits', 'Precut Kits'],
    description: `Pre-cut tint kit matched for ${label}.`,
    imagePath: CUSTOMIZER_DEFAULT_VIEWS.side,
    imageLabel: `${label} Tint Kit`,
    selectedVehicle: vehicle,
    productUrl: `product.html?${new URLSearchParams({
      type,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      ...(vehicle.trim ? { trim: vehicle.trim } : {}),
      ...(vehicle.kitSku ? { sku: vehicle.kitSku } : {})
    }).toString()}`
  };
}

function productSearchText(product) {
  return [
    product?.id,
    product?.name,
    product?.slug,
    product?.category,
    product?.subcategory,
    product?.subSubcategory,
    product?.imageLabel,
    ...(Array.isArray(product?.tags) ? product.tags : [])
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function isRacingStripeProduct(product) {
  if (!product) return false;
  if (normalizeText(product.subSubcategory) === 'racing stripes') return true;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  return tags.some((tag) => normalizeText(tag) === 'racing stripes');
}

function getProductMode(product) {
  if (isRacingStripeProduct(product)) return 'Racing Stripes';
  return product?.subSubcategory || product?.subcategory || product?.category || 'Custom Decals';
}

function getRacingStripeSvgPath(product) {
  const explicitPath = product?.stripeOptions?.previewSvgPath;
  if (explicitPath) return explicitPath;

  const searchable = productSearchText(product);
  if (searchable.includes('staggered')) return `${RACING_STRIPE_PREVIEW_BASE}/staggered-stripes.svg`;
  if (searchable.includes('dual top outlined')) return `${RACING_STRIPE_PREVIEW_BASE}/dual-top-outlined-stripes.svg`;
  if (searchable.includes('outlined single') || searchable.includes('single outlined')) return `${RACING_STRIPE_PREVIEW_BASE}/single-outlined-stripe.svg`;
  if (searchable.includes('dual') || searchable.includes('double')) return `${RACING_STRIPE_PREVIEW_BASE}/dual-stripes.svg`;
  return `${RACING_STRIPE_PREVIEW_BASE}/single-stripe.svg`;
}

function isOutlinedProduct(product) {
  if (typeof product?.stripeOptions?.hasOutline === 'boolean') return product.stripeOptions.hasOutline;
  const searchable = productSearchText(product);
  return searchable.includes('outline') || searchable.includes('outlined');
}

async function loadSvg(path) {
  if (!svgCache.has(path)) {
    svgCache.set(path, fetch(path).then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${path}`);
      return response.text();
    }));
  }

  return svgCache.get(path);
}

function cleanInlineSvg(svgText, className) {
  return String(svgText || '')
    .replace(/<\?xml[^>]*>\s*/i, '')
    .replace(/<!--[\s\S]*?-->\s*/g, '')
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace(/<svg\b/, `<svg class="${className}" preserveAspectRatio="xMidYMid meet"`);
}

function colorizeInlineSvg(svgText, fillColor, strokeColor, className = 'customizer-overlay-svg') {
  return cleanInlineSvg(svgText, className)
    .replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, `fill:${fillColor}`)
    .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/g, `stroke:${strokeColor}`);
}

function escapeSvgText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createGenericDecalSvg(product, fillColor) {
  const label = escapeSvgText(product?.subSubcategory || product?.subcategory || product?.name || 'Custom Decal');
  const shortLabel = label.length > 24 ? `${label.slice(0, 21)}...` : label;

  return `
    <svg class="customizer-overlay-svg" viewBox="0 0 640 180" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${shortLabel}">
      <path d="M42 90 C118 26 218 26 318 90 S520 154 598 90" fill="none" stroke="${fillColor}" stroke-width="28" stroke-linecap="round"/>
      <path d="M58 126 C144 78 228 76 320 126 S498 174 580 126" fill="none" stroke="${fillColor}" stroke-width="10" stroke-linecap="round" opacity="0.75"/>
      <text x="320" y="83" text-anchor="middle" dominant-baseline="middle" fill="${fillColor}" font-family="Arial Black, Impact, sans-serif" font-size="38">${shortLabel}</text>
    </svg>
  `;
}

function buildDecalOptions(products) {
  return products
    .filter((product) => String(product?.category || '').toLowerCase() === 'decals')
    .map((product) => ({
      product,
      id: String(product.id || ''),
      label: product.name || product.imageLabel || 'Custom Decal',
      mode: getProductMode(product),
      svgPath: isRacingStripeProduct(product) ? getRacingStripeSvgPath(product) : '',
      outlined: isOutlinedProduct(product)
    }))
    .filter((option) => option.id);
}

function getSelectOptionsMarkup(options, selectedValue) {
  return options.map((option) => {
    const selected = option.value === selectedValue ? ' selected' : '';
    return `<option value="${option.value}"${selected}>${option.label}</option>`;
  }).join('');
}

function getFilteredDecals(decalOptions, mode) {
  if (!mode || mode === 'all') return decalOptions;
  return decalOptions.filter((option) => option.mode === mode);
}

async function renderDecalLayer({ decalLayer, option, fillColor }) {
  if (!option) {
    decalLayer.innerHTML = '';
    return;
  }

  const strokeColor = option.outlined ? '#050505' : fillColor;

  if (option.svgPath) {
    try {
      const svgText = await loadSvg(option.svgPath);
      decalLayer.innerHTML = colorizeInlineSvg(svgText, fillColor, strokeColor);
      return;
    } catch {
      decalLayer.innerHTML = createGenericDecalSvg(option.product, fillColor);
      return;
    }
  }

  decalLayer.innerHTML = createGenericDecalSvg(option.product, fillColor);
}

function setLayerTransform(layer, size, x, y, rotate) {
  layer.style.width = `${size}%`;
  layer.style.transform = `translate(calc(-50% + ${x}%), calc(-50% + ${y}%)) rotate(${rotate}deg)`;
}

async function initCustomizePage() {
  const form = document.getElementById('customizeForm');
  const baseImage = document.getElementById('customizeBaseImage');
  const decalLayer = document.getElementById('customizeDecal');
  const textLayer = document.getElementById('customizeTextLayer');
  const productName = document.getElementById('customizeProductName');
  const productMeta = document.getElementById('customizeProductMeta');
  const modeEyebrow = document.getElementById('customizeModeEyebrow');
  const vehicleNote = document.getElementById('customizeVehicleNote');
  const backToProduct = document.getElementById('backToProduct');
  const continueToCheckout = document.getElementById('continueToCheckout');

  if (!(form && baseImage && decalLayer && textLayer && continueToCheckout)) return;

  if (typeof window.ensureProductsLoaded === 'function') {
    await window.ensureProductsLoaded();
  }

  const products = typeof window.getProductsList === 'function'
    ? window.getProductsList()
    : (window.PRODUCTS || []);
  const vehicleProduct = createVehicleKitFromCustomizeQuery();
  const productId = getCustomizeParam('productId');
  const selectedProduct = vehicleProduct || (typeof window.findProductById === 'function' ? window.findProductById(productId) : null);
  const decalOptions = buildDecalOptions(products);
  const initialProduct = selectedProduct || decalOptions[0]?.product || products[0] || null;
  const initialMode = getProductMode(initialProduct);

  let activeMode = productId && initialMode ? initialMode : 'all';
  let activeDecalId = initialProduct?.id || decalOptions[0]?.id || '';
  let uploadedVehicleUrl = '';
  let decalRenderRequestId = 0;

  const selectedVehicle = vehicleProduct?.selectedVehicle || getVehicleFromCustomizeQuery() || (typeof window.getSelectedVehicle === 'function' ? window.getSelectedVehicle() : null);
  if (selectedVehicle && typeof window.setSelectedVehicle === 'function') {
    window.setSelectedVehicle(selectedVehicle);
  }

  const vehicleViewSelect = document.getElementById('vehicleViewSelect');
  const vehicleImageUpload = document.getElementById('vehicleImageUpload');
  const modeSelect = document.getElementById('customizerModeSelect');
  const decalSelect = document.getElementById('decalSelect');
  const showAllModesBtn = document.getElementById('showAllModesBtn');
  const decalColorInput = document.getElementById('decalColor');
  const decalSizeInput = document.getElementById('decalSize');
  const decalRotateInput = document.getElementById('decalRotate');
  const decalXInput = document.getElementById('decalX');
  const decalYInput = document.getElementById('decalY');
  const textInput = document.getElementById('designText');
  const textFontInput = document.getElementById('textFont');
  const textColorInput = document.getElementById('textColor');
  const textSizeInput = document.getElementById('textSize');
  const textRotateInput = document.getElementById('textRotate');
  const textXInput = document.getElementById('textX');
  const textYInput = document.getElementById('textY');

  if (productName) productName.textContent = initialProduct?.name || 'Custom Decal Mockup';
  if (productMeta) {
    productMeta.textContent = activeMode === 'all'
      ? 'Full customizer'
      : `${activeMode} mode`;
  }
  if (modeEyebrow) modeEyebrow.textContent = activeMode === 'all' ? 'Full Customizer' : `${activeMode} Mode`;
  if (backToProduct) backToProduct.href = initialProduct?.productUrl || (initialProduct?.id ? `product.html?id=${encodeURIComponent(initialProduct.id)}` : 'shop.html');
  if (vehicleNote) {
    vehicleNote.textContent = selectedVehicle?.label
      ? `Selected vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (${selectedVehicle.kitSku})` : ''}`
      : '';
  }

  function syncModeOptions() {
    const modes = [...new Set(decalOptions.map((option) => option.mode).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
    const options = [{ value: 'all', label: 'All Products' }].concat(
      modes.map((mode) => ({ value: mode, label: mode }))
    );

    modeSelect.innerHTML = getSelectOptionsMarkup(options, activeMode);
    showAllModesBtn.hidden = activeMode === 'all';
  }

  function syncDecalOptions() {
    const filtered = getFilteredDecals(decalOptions, activeMode);
    const nextOptions = filtered.length ? filtered : decalOptions;

    if (!nextOptions.some((option) => option.id === activeDecalId)) {
      activeDecalId = nextOptions[0]?.id || '';
    }

    decalSelect.innerHTML = nextOptions.map((option) => {
      const selected = option.id === activeDecalId ? ' selected' : '';
      return `<option value="${option.id}"${selected}>${option.label}</option>`;
    }).join('');
  }

  function getActiveDecalOption() {
    return decalOptions.find((option) => option.id === activeDecalId) || decalOptions[0] || null;
  }

  async function updateDecal() {
    const requestId = ++decalRenderRequestId;
    const option = getActiveDecalOption();
    const fillColor = decalColorInput?.value || '#111111';

    if (productName) productName.textContent = option?.label || 'Custom Decal Mockup';
    if (productMeta) {
      productMeta.textContent = activeMode === 'all'
        ? `Full customizer - ${option?.mode || 'Decals'}`
        : `${activeMode} mode`;
    }
    if (modeEyebrow) modeEyebrow.textContent = activeMode === 'all' ? 'Full Customizer' : `${activeMode} Mode`;

    await renderDecalLayer({ decalLayer, option, fillColor });
    if (requestId !== decalRenderRequestId) return;
  }

  function updateVehicleImage() {
    baseImage.src = uploadedVehicleUrl || vehicleViewSelect?.value || CUSTOMIZER_DEFAULT_VIEWS.side;
  }

  function updateTransforms() {
    setLayerTransform(
      decalLayer,
      Number(decalSizeInput?.value || 72),
      Number(decalXInput?.value || 0),
      Number(decalYInput?.value || 0),
      Number(decalRotateInput?.value || 0)
    );

    const textValue = (textInput?.value || '').trim();
    textLayer.textContent = textValue.toUpperCase();
    textLayer.hidden = !textValue;
    textLayer.style.color = textColorInput?.value || '#7dff5a';
    textLayer.style.fontFamily = textFontInput?.value || 'Arial Black, Impact, sans-serif';
    textLayer.style.fontSize = `${Number(textSizeInput?.value || 42)}px`;
    setLayerTransform(
      textLayer,
      80,
      Number(textXInput?.value || 0),
      Number(textYInput?.value || 24),
      Number(textRotateInput?.value || 0)
    );
  }

  function updateAll() {
    updateVehicleImage();
    updateTransforms();
    updateDecal();
  }

  syncModeOptions();
  syncDecalOptions();
  updateAll();

  vehicleViewSelect?.addEventListener('change', () => {
    uploadedVehicleUrl = '';
    if (vehicleImageUpload) vehicleImageUpload.value = '';
    updateVehicleImage();
  });

  vehicleImageUpload?.addEventListener('change', () => {
    const file = vehicleImageUpload.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      uploadedVehicleUrl = String(reader.result || '');
      updateVehicleImage();
    });
    reader.readAsDataURL(file);
  });

  modeSelect?.addEventListener('change', () => {
    activeMode = modeSelect.value || 'all';
    syncModeOptions();
    syncDecalOptions();
    updateAll();
  });

  showAllModesBtn?.addEventListener('click', () => {
    activeMode = 'all';
    syncModeOptions();
    syncDecalOptions();
    updateAll();
  });

  decalSelect?.addEventListener('change', () => {
    activeDecalId = decalSelect.value || '';
    updateAll();
  });

  [
    decalColorInput,
    decalSizeInput,
    decalRotateInput,
    decalXInput,
    decalYInput,
    textInput,
    textFontInput,
    textColorInput,
    textSizeInput,
    textRotateInput,
    textXInput,
    textYInput
  ].forEach((input) => {
    input?.addEventListener('input', updateAll);
    input?.addEventListener('change', updateAll);
  });

  continueToCheckout.addEventListener('click', () => {
    const option = getActiveDecalOption();
    const customizationSummary = [
      `Mode: ${activeMode === 'all' ? 'Full Customizer' : activeMode}`,
      `Decal: ${option?.label || 'Custom Decal'}`,
      `Decal color: ${decalColorInput?.value || '#111111'}`,
      `Decal size: ${decalSizeInput?.value || '72'}%`,
      `Decal rotation: ${decalRotateInput?.value || '0'}deg`,
      `Decal position: X ${decalXInput?.value || '0'}, Y ${decalYInput?.value || '0'}`,
      `Text: ${(textInput?.value || '').trim() || 'None'}`,
      `Text color: ${textColorInput?.value || '#7dff5a'}`,
      `Text size: ${textSizeInput?.value || '42'}`,
      `Text font: ${titleCase(textFontInput?.selectedOptions?.[0]?.textContent || 'Block')}`
    ];

    if (uploadedVehicleUrl) customizationSummary.push('Vehicle image: customer uploaded');
    if (selectedVehicle?.label) {
      customizationSummary.push(`Vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (${selectedVehicle.kitSku})` : ''}`);
    }

    const params = new URLSearchParams();
    params.set('customNote', customizationSummary.join(' | '));

    if (selectedVehicle?.year && selectedVehicle?.make && selectedVehicle?.model) {
      params.set('year', selectedVehicle.year);
      params.set('make', selectedVehicle.make);
      params.set('model', selectedVehicle.model);
      if (selectedVehicle.trim) params.set('trim', selectedVehicle.trim);
      if (selectedVehicle.kitSku) params.set('sku', selectedVehicle.kitSku);
    }

    window.location.href = `checkout.html?${params.toString()}`;
  });
}

document.addEventListener('DOMContentLoaded', initCustomizePage);
