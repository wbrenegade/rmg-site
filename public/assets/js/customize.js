const CUSTOMIZER_DEFAULT_VIEWS = {
  side: '/assets/imgs/previews/customizer/right-side.png',
  rightSide: '/assets/imgs/previews/customizer/right-side.png',
  leftSide: '/assets/imgs/previews/customizer/left-side.png',
  front: '/assets/imgs/previews/customizer/front.png',
  rear: '/assets/imgs/previews/customizer/rear.png'
};

const RACING_STRIPE_PREVIEW_BASE = '/assets/imgs/previews/racing-stripes';
const GRAPHICS_PREVIEW_BASE = '/assets/imgs/previews/graphics';
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

function getGraphicsSvgPath(product) {
  const explicitPath = product?.graphicOptions?.previewSvgPath || product?.previewSvgPath;
  if (explicitPath) return explicitPath;

  const searchable = productSearchText(product);
  if (searchable.includes('honeycomb') || searchable.includes('geometrical')) {
    return `${GRAPHICS_PREVIEW_BASE}/honeycomb.svg`;
  }

  return '';
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

function inlineStyleValue(element, propertyName) {
  const style = element.getAttribute('style') || '';
  const match = style.match(new RegExp(`${propertyName}\\s*:\\s*([^;]+)`, 'i'));
  return match ? match[1].trim() : '';
}

function setInlineStyleValue(element, propertyName, value) {
  const style = element.getAttribute('style') || '';
  const nextDeclaration = `${propertyName}:${value}`;
  const pattern = new RegExp(`${propertyName}\\s*:\\s*[^;]+`, 'i');
  const nextStyle = pattern.test(style)
    ? style.replace(pattern, nextDeclaration)
    : [style.replace(/;\s*$/, ''), nextDeclaration].filter(Boolean).join(';');

  element.setAttribute('style', nextStyle);
}

function getSvgShapeElements(svg) {
  if (!svg) return [];
  return [...svg.querySelectorAll('use, path, polygon, polyline, rect, circle, ellipse, line')]
    .filter((element) => !element.closest('defs'));
}

function colorizeInlineSvg(svgText, fillColor, strokeColor, className = 'customizer-overlay-svg') {
  return cleanInlineSvg(svgText, className)
    .replace(/fill:\s*#[0-9a-fA-F]{3,8}/g, `fill:${fillColor}`)
    .replace(/stroke:\s*#[0-9a-fA-F]{3,8}/g, `stroke:${strokeColor}`)
    .replace(/fill="(?!none)[#a-zA-Z0-9(),.\s-]+"/g, `fill="${fillColor}"`)
    .replace(/stroke="[#a-zA-Z0-9(),.\s-]+"/g, `stroke="${strokeColor}"`);
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
  const productOptions = products
    .filter((product) => String(product?.category || '').toLowerCase() === 'decals')
    .map((product) => ({
      product,
      id: String(product.id || ''),
      label: product.name || product.imageLabel || 'Custom Decal',
      mode: getProductMode(product),
      svgPath: isRacingStripeProduct(product) ? getRacingStripeSvgPath(product) : getGraphicsSvgPath(product),
      outlined: isOutlinedProduct(product)
    }))
    .filter((option) => option.id);

  const builtInOptions = [{
    product: {
      id: 'customizer-honeycomb-graphics',
      name: 'Honeycomb Graphics',
      category: 'Decals',
      subcategory: 'Rear Quarter Panel',
      subSubcategory: 'Graphics',
      price: 74.99
    },
    id: 'customizer-honeycomb-graphics',
    label: 'Honeycomb Graphics',
    mode: 'Graphics',
    svgPath: `${GRAPHICS_PREVIEW_BASE}/honeycomb.svg`,
    outlined: true
  }];

  const productIds = new Set(productOptions.map((option) => option.id));
  return productOptions.concat(builtInOptions.filter((option) => !productIds.has(option.id)));
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function downloadFile(filename, href) {
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
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
  const downloadPreviewBtn = document.getElementById('downloadCustomizerPreview');
  const sharePreviewBtn = document.getElementById('shareCustomizerPreview');

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
  let originalShapeSnapshot = '';
  let undoStack = [];
  let redoStack = [];
  let activeShapeId = 'all';
  let shapeDragState = null;

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
  const shapeEditScopeInput = document.getElementById('shapeEditScope');
  const shapeElementSelect = document.getElementById('shapeElementSelect');
  const shapeFillColorInput = document.getElementById('shapeFillColor');
  const shapeStrokeColorInput = document.getElementById('shapeStrokeColor');
  const shapeStrokeWidthInput = document.getElementById('shapeStrokeWidth');
  const undoShapeEditBtn = document.getElementById('undoShapeEdit');
  const redoShapeEditBtn = document.getElementById('redoShapeEdit');
  const resetShapeElementsBtn = document.getElementById('resetShapeElements');
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

  function getEditableSvg() {
    return decalLayer.querySelector('svg');
  }

  function getEditableShapes() {
    return getSvgShapeElements(getEditableSvg());
  }

  function getShapeSnapshot() {
    const svg = getEditableSvg();
    return svg ? svg.innerHTML : '';
  }

  function applyShapeSnapshot(snapshot) {
    const svg = getEditableSvg();
    if (!svg) return;
    svg.innerHTML = snapshot;
    prepareShapeEditor(false);
  }

  function updateHistoryButtons() {
    if (undoShapeEditBtn) undoShapeEditBtn.disabled = undoStack.length === 0;
    if (redoShapeEditBtn) redoShapeEditBtn.disabled = redoStack.length === 0;
    if (resetShapeElementsBtn) resetShapeElementsBtn.disabled = !originalShapeSnapshot;
  }

  function pushShapeHistory() {
    const snapshot = getShapeSnapshot();
    if (!snapshot || undoStack[undoStack.length - 1] === snapshot) return;
    undoStack.push(snapshot);
    if (undoStack.length > 60) undoStack.shift();
    redoStack = [];
    updateHistoryButtons();
  }

  function getTargetShapes() {
    const shapes = getEditableShapes();
    const scope = shapeEditScopeInput?.value || 'group';
    if (scope === 'individual' && activeShapeId !== 'all') {
      return shapes.filter((shape) => shape.dataset.shapeId === activeShapeId);
    }
    return shapes;
  }

  function setShapeSelectedClasses() {
    const shapes = getEditableShapes();
    shapes.forEach((shape) => {
      const selected = activeShapeId !== 'all' && shape.dataset.shapeId === activeShapeId;
      shape.classList.toggle('is-selected-shape', selected);
    });
  }

  function syncShapeSelectOptions() {
    if (!shapeElementSelect) return;

    const shapes = getEditableShapes();
    const options = ['<option value="all">All Shapes</option>'].concat(
      shapes.map((shape, index) => {
        const id = shape.dataset.shapeId || `shape-${index + 1}`;
        const selected = id === activeShapeId ? ' selected' : '';
        return `<option value="${id}"${selected}>Shape ${index + 1}</option>`;
      })
    );

    if (activeShapeId !== 'all' && !shapes.some((shape) => shape.dataset.shapeId === activeShapeId)) {
      activeShapeId = 'all';
    }

    shapeElementSelect.innerHTML = options.join('');
    shapeElementSelect.value = activeShapeId;
    setShapeSelectedClasses();
  }

  function syncShapeInputsFromSelection() {
    const target = getTargetShapes()[0];
    if (!target) return;

    const fill = target.getAttribute('fill') || inlineStyleValue(target, 'fill') || decalColorInput?.value || '#111111';
    const stroke = target.getAttribute('stroke') || inlineStyleValue(target, 'stroke') || shapeStrokeColorInput?.value || '#111111';
    const strokeWidth = target.getAttribute('stroke-width') || inlineStyleValue(target, 'stroke-width') || '6';

    if (shapeFillColorInput && fill !== 'none' && /^#[0-9a-fA-F]{3,8}$/.test(fill)) {
      shapeFillColorInput.value = fill.length === 4
        ? `#${fill[1]}${fill[1]}${fill[2]}${fill[2]}${fill[3]}${fill[3]}`
        : fill.slice(0, 7);
    }
    if (shapeStrokeColorInput && /^#[0-9a-fA-F]{3,8}$/.test(stroke)) {
      shapeStrokeColorInput.value = stroke.length === 4
        ? `#${stroke[1]}${stroke[1]}${stroke[2]}${stroke[2]}${stroke[3]}${stroke[3]}`
        : stroke.slice(0, 7);
    }
    if (shapeStrokeWidthInput) {
      shapeStrokeWidthInput.value = String(Math.max(0, Math.min(24, Number.parseFloat(strokeWidth) || 0)));
    }
  }

  function applyShapeStyles(recordHistory = true) {
    const targets = getTargetShapes();
    if (!targets.length) return;

    if (recordHistory) pushShapeHistory();

    const fillColor = shapeFillColorInput?.value || '#111111';
    const strokeColor = shapeStrokeColorInput?.value || fillColor;
    const strokeWidth = shapeStrokeWidthInput?.value || '0';

    targets.forEach((shape) => {
      if (!['line', 'polyline'].includes(shape.tagName.toLowerCase())) {
        shape.setAttribute('fill', fillColor);
        setInlineStyleValue(shape, 'fill', fillColor);
      }

      shape.setAttribute('stroke', strokeColor);
      setInlineStyleValue(shape, 'stroke', strokeColor);
      shape.setAttribute('stroke-width', strokeWidth);
      setInlineStyleValue(shape, 'stroke-width', strokeWidth);
    });

    updateHistoryButtons();
  }

  function translateShape(shape, dx, dy) {
    const x = Number.parseFloat(shape.getAttribute('x') || '0');
    const y = Number.parseFloat(shape.getAttribute('y') || '0');
    shape.setAttribute('x', String(x + dx));
    shape.setAttribute('y', String(y + dy));
  }

  function translateTargetShapes(dx, dy) {
    getTargetShapes().forEach((shape) => translateShape(shape, dx, dy));
  }

  function prepareShapeEditor(resetHistory = true) {
    const shapes = getEditableShapes();
    shapes.forEach((shape, index) => {
      shape.dataset.shapeId = shape.dataset.shapeId || `shape-${index + 1}`;
      shape.classList.add('customizer-editable-shape');
    });

    if (resetHistory) {
      originalShapeSnapshot = getShapeSnapshot();
      undoStack = [];
      redoStack = [];
      activeShapeId = 'all';
    }

    syncShapeSelectOptions();
    syncShapeInputsFromSelection();
    updateHistoryButtons();
  }

  function getCustomizerSettings() {
    const option = getActiveDecalOption();
    return {
      mode: activeMode === 'all' ? 'Full Customizer' : activeMode,
      decalName: option?.label || 'Custom Decal',
      decalProductId: option?.id || '',
      decalColor: decalColorInput?.value || '#111111',
      decalSize: `${decalSizeInput?.value || '72'}%`,
      decalRotation: `${decalRotateInput?.value || '0'}deg`,
      decalPosition: `X ${decalXInput?.value || '0'}, Y ${decalYInput?.value || '0'}`,
      text: (textInput?.value || '').trim() || 'None',
      textColor: textColorInput?.value || '#7dff5a',
      textSize: textSizeInput?.value || '42',
      textFont: titleCase(textFontInput?.selectedOptions?.[0]?.textContent || 'Block'),
      vehicleImage: uploadedVehicleUrl ? 'Customer uploaded' : titleCase(vehicleViewSelect?.selectedOptions?.[0]?.textContent || 'Default'),
      placementPreset: activeMode === 'all' ? 'Custom' : activeMode,
      blendMode: 'Normal',
      opacity: 100,
      vinylFinish: 'Standard'
    };
  }

  function layerRectInStage(layer, stageRect, scale) {
    const rect = layer.getBoundingClientRect();
    return {
      x: (rect.left - stageRect.left) * scale,
      y: (rect.top - stageRect.top) * scale,
      width: rect.width * scale,
      height: rect.height * scale
    };
  }

  async function drawSvgLayer(ctx, layer, stageRect, scale) {
    const svg = layer.querySelector('svg');
    if (!svg) return;

    const exportSvg = svg.cloneNode(true);
    exportSvg.querySelectorAll('.is-selected-shape').forEach((shape) => shape.classList.remove('is-selected-shape'));
    const serialized = new XMLSerializer().serializeToString(exportSvg);
    const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
    const image = await loadImage(src);
    const rect = layerRectInStage(layer, stageRect, scale);
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }

  function drawTextLayer(ctx, layer, stageRect, scale) {
    const text = layer.textContent.trim();
    if (!text || layer.hidden) return;

    const rect = layerRectInStage(layer, stageRect, scale);
    const style = window.getComputedStyle(layer);
    const fontSize = Number.parseFloat(style.fontSize || '42') * scale;
    ctx.save();
    ctx.fillStyle = style.color || '#7dff5a';
    ctx.font = `900 ${fontSize}px ${style.fontFamily || 'Arial Black, Impact, sans-serif'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 8 * scale;
    ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
  }

  async function createPreviewImage(maxWidth = 900) {
    const stage = document.getElementById('customizeViewer');
    if (!stage) return null;

    const stageRect = stage.getBoundingClientRect();
    const width = Math.max(1, Math.round(Math.min(maxWidth, stageRect.width)));
    const scale = width / stageRect.width;
    const height = Math.max(1, Math.round(stageRect.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, width, height);

    const vehicleImage = await loadImage(baseImage.currentSrc || baseImage.src);
    const imageRect = layerRectInStage(baseImage, stageRect, scale);
    ctx.drawImage(vehicleImage, imageRect.x, imageRect.y, imageRect.width, imageRect.height);

    await drawSvgLayer(ctx, decalLayer, stageRect, scale);
    drawTextLayer(ctx, textLayer, stageRect, scale);

    return canvas.toDataURL('image/png', 0.92);
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
    prepareShapeEditor(true);
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

  downloadPreviewBtn?.addEventListener('click', async () => {
    const previewImage = await createPreviewImage(1200);
    if (!previewImage) return;
    downloadFile('rmg-customizer-preview.png', previewImage);
  });

  sharePreviewBtn?.addEventListener('click', async () => {
    const settings = getCustomizerSettings();
    const shareText = [
      'RenegadeMade Graphix customizer preview',
      `Mode: ${settings.mode}`,
      `Decal: ${settings.decalName}`,
      `Text: ${settings.text}`
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: 'RMG Customizer Preview', text: shareText });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      alert('Design details copied.');
    } catch {
      alert(shareText);
    }
  });

  decalSelect?.addEventListener('change', () => {
    activeDecalId = decalSelect.value || '';
    updateAll();
  });

  decalColorInput?.addEventListener('input', () => {
    if (shapeFillColorInput) shapeFillColorInput.value = decalColorInput.value;
    if (shapeStrokeColorInput) shapeStrokeColorInput.value = decalColorInput.value;
    const previousScope = shapeEditScopeInput?.value || 'group';
    const previousShapeId = activeShapeId;
    if (shapeEditScopeInput) shapeEditScopeInput.value = 'group';
    activeShapeId = 'all';
    applyShapeStyles(true);
    if (shapeEditScopeInput) shapeEditScopeInput.value = previousScope;
    activeShapeId = previousShapeId;
    syncShapeSelectOptions();
  });

  [decalSizeInput, decalRotateInput, decalXInput, decalYInput].forEach((input) => {
    input?.addEventListener('input', updateTransforms);
    input?.addEventListener('change', updateTransforms);
  });

  [textInput, textFontInput, textColorInput, textSizeInput, textRotateInput, textXInput, textYInput].forEach((input) => {
    input?.addEventListener('input', updateTransforms);
    input?.addEventListener('change', updateTransforms);
  });

  shapeElementSelect?.addEventListener('change', () => {
    activeShapeId = shapeElementSelect.value || 'all';
    if (activeShapeId !== 'all' && shapeEditScopeInput) shapeEditScopeInput.value = 'individual';
    setShapeSelectedClasses();
    syncShapeInputsFromSelection();
  });

  shapeEditScopeInput?.addEventListener('change', () => {
    if (shapeEditScopeInput.value === 'group') {
      activeShapeId = 'all';
      syncShapeSelectOptions();
    }
    syncShapeInputsFromSelection();
  });

  [shapeFillColorInput, shapeStrokeColorInput, shapeStrokeWidthInput].forEach((input) => {
    input?.addEventListener('input', () => applyShapeStyles(true));
    input?.addEventListener('change', () => applyShapeStyles(true));
  });

  undoShapeEditBtn?.addEventListener('click', () => {
    const current = getShapeSnapshot();
    const previous = undoStack.pop();
    if (!previous) return;
    redoStack.push(current);
    applyShapeSnapshot(previous);
    updateHistoryButtons();
  });

  redoShapeEditBtn?.addEventListener('click', () => {
    const current = getShapeSnapshot();
    const next = redoStack.pop();
    if (!next) return;
    undoStack.push(current);
    applyShapeSnapshot(next);
    updateHistoryButtons();
  });

  resetShapeElementsBtn?.addEventListener('click', () => {
    if (!originalShapeSnapshot) return;
    pushShapeHistory();
    applyShapeSnapshot(originalShapeSnapshot);
    redoStack = [];
    updateHistoryButtons();
  });

  decalLayer.addEventListener('pointerdown', (event) => {
    const shape = event.target.closest?.('.customizer-editable-shape');
    const svg = getEditableSvg();
    if (!shape || !svg) return;

    event.preventDefault();
    if (shapeEditScopeInput?.value === 'individual') {
      activeShapeId = shape.dataset.shapeId || 'all';
      syncShapeSelectOptions();
      syncShapeInputsFromSelection();
    }

    pushShapeHistory();
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    shapeDragState = {
      pointerId: event.pointerId,
      lastX: svgPoint.x,
      lastY: svgPoint.y
    };
    decalLayer.setPointerCapture?.(event.pointerId);
  });

  decalLayer.addEventListener('pointermove', (event) => {
    if (!shapeDragState || shapeDragState.pointerId !== event.pointerId) return;
    const svg = getEditableSvg();
    if (!svg) return;

    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    const dx = svgPoint.x - shapeDragState.lastX;
    const dy = svgPoint.y - shapeDragState.lastY;

    translateTargetShapes(dx, dy);
    shapeDragState.lastX = svgPoint.x;
    shapeDragState.lastY = svgPoint.y;
  });

  ['pointerup', 'pointercancel'].forEach((eventName) => {
    decalLayer.addEventListener(eventName, (event) => {
      if (!shapeDragState || shapeDragState.pointerId !== event.pointerId) return;
      shapeDragState = null;
      decalLayer.releasePointerCapture?.(event.pointerId);
      updateHistoryButtons();
    });
  });

  continueToCheckout.addEventListener('click', () => {
    const option = getActiveDecalOption();
    const settings = getCustomizerSettings();
    const customizationSummary = [
      `Mode: ${settings.mode}`,
      `Decal: ${settings.decalName}`,
      `Decal color: ${settings.decalColor}`,
      `Decal size: ${settings.decalSize}`,
      `Decal rotation: ${settings.decalRotation}`,
      `Decal position: ${settings.decalPosition}`,
      `Text: ${settings.text}`,
      `Text color: ${settings.textColor}`,
      `Text size: ${settings.textSize}`,
      `Text font: ${settings.textFont}`
    ];

    if (uploadedVehicleUrl) customizationSummary.push('Vehicle image: customer uploaded');
    if (selectedVehicle?.label) {
      customizationSummary.push(`Vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (${selectedVehicle.kitSku})` : ''}`);
    }

    Promise.resolve(createPreviewImage(700)).then((previewImage) => {
      const checkoutData = {
        source: 'customizer-tool',
        productId: option?.id || 'customizer-decal',
        name: `${settings.decalName} Customizer Mockup`,
        title: `${settings.decalName} Customizer Mockup`,
        size: 'Custom',
        price: Number(option?.product?.price || 39.99),
        quantity: 1,
        previewImage,
        settings: {
          ...settings,
          customNote: customizationSummary.join(' | ')
        }
      };

      sessionStorage.setItem('checkout_data', JSON.stringify(checkoutData));
      localStorage.setItem('checkout_data', JSON.stringify({
        ...checkoutData,
        previewImage: null
      }));

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
  });
}

document.addEventListener('DOMContentLoaded', initCustomizePage);
