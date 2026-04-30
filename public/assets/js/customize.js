const CUSTOMIZER_DEFAULT_VIEWS = {
  side: '/assets/imgs/previews/customizer/right-side.png',
  rightSide: '/assets/imgs/previews/customizer/right-side.png',
  leftSide: '/assets/imgs/previews/customizer/left-side.png',
  front: '/assets/imgs/previews/customizer/front.png',
  rear: '/assets/imgs/previews/customizer/rear.png'
};

const RACING_STRIPE_PREVIEW_BASE = '/assets/imgs/previews/racing-stripes';
const GRAPHICS_PREVIEW_BASE = '/assets/imgs/previews/graphics';
const PREMADE_DECAL_OPTIONS = [
  {
    id: 'graphics-geo-triags',
    label: 'Graphics - Geo Triags',
    path: '/assets/svg/graphics/geo_triags.png',
    type: 'image'
  },
  {
    id: 'graphics-honeycomb',
    label: 'Graphics - Honeycomb',
    path: '/assets/svg/graphics/honeycomb.svg',
    type: 'svg',
    outlined: true
  },
  {
    id: 'racing-stripes-dual-stripes',
    label: 'Racing Stripes - Dual Stripes',
    path: '/assets/svg/racing-stripes/dual-stripes.svg',
    type: 'svg',
    outlined: false
  },
  {
    id: 'racing-stripes-dual-top-outlined-stripes',
    label: 'Racing Stripes - Dual Top Outlined Stripes',
    path: '/assets/svg/racing-stripes/dual-top-outlined-stripes.svg',
    type: 'svg',
    outlined: true
  },
  {
    id: 'racing-stripes-single-outlined-stripe',
    label: 'Racing Stripes - Single Outlined Stripe',
    path: '/assets/svg/racing-stripes/single-outlined-stripe.svg',
    type: 'svg',
    outlined: true
  },
  {
    id: 'racing-stripes-single-stripe',
    label: 'Racing Stripes - Single Stripe',
    path: '/assets/svg/racing-stripes/single-stripe.svg',
    type: 'svg',
    outlined: false
  },
  {
    id: 'racing-stripes-staggered-stripes',
    label: 'Racing Stripes - Staggered Stripes',
    path: '/assets/svg/racing-stripes/staggered-stripes.svg',
    type: 'svg',
    outlined: false
  }
];
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

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function hexToRgb(hexColor) {
  const normalized = String(hexColor || '').replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return { r: 17, g: 17, b: 17 };
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function tintFilterForHex(hexColor) {
  const { r, g, b } = hexToRgb(hexColor);
  return `brightness(0) saturate(100%) sepia(1) saturate(10000%) opacity(1) drop-shadow(0 0 0 rgb(${r} ${g} ${b}))`;
}

function applyInlineSvgColors(svg, fillColor, strokeColor) {
  if (!svg) return;

  svg.querySelectorAll('[fill], [style*="fill"]').forEach((element) => {
    const fill = element.getAttribute('fill') || inlineStyleValue(element, 'fill');
    if (String(fill || '').trim().toLowerCase() === 'none') return;
    element.setAttribute('fill', fillColor);
    setInlineStyleValue(element, 'fill', fillColor);
  });

  svg.querySelectorAll('[stroke], [style*="stroke"]').forEach((element) => {
    const stroke = element.getAttribute('stroke') || inlineStyleValue(element, 'stroke');
    if (String(stroke || '').trim().toLowerCase() === 'none') return;
    element.setAttribute('stroke', strokeColor);
    setInlineStyleValue(element, 'stroke', strokeColor);
  });
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

  if (option.type === 'image') {
    decalLayer.innerHTML = `
      <img class="customizer-decal-image" src="${escapeHtml(option.path)}" alt="${escapeHtml(option.label)}" draggable="false" />
      <div class="customizer-decal-selection" aria-hidden="true"></div>
      <button type="button" class="customizer-rotate-handle" aria-label="Rotate decal"></button>
      <button type="button" class="customizer-resize-handle" aria-label="Resize decal"></button>
    `;
    decalLayer.querySelector('.customizer-decal-image')?.style.setProperty('filter', tintFilterForHex(fillColor));
    return;
  }

  if (option.path || option.svgPath) {
    try {
      const svgText = await loadSvg(option.path || option.svgPath);
      decalLayer.innerHTML = `${colorizeInlineSvg(svgText, fillColor, strokeColor)}
        <div class="customizer-decal-selection" aria-hidden="true"></div>
        <button type="button" class="customizer-rotate-handle" aria-label="Rotate decal"></button>
        <button type="button" class="customizer-resize-handle" aria-label="Resize decal"></button>`;
      applyInlineSvgColors(decalLayer.querySelector('svg'), fillColor, strokeColor);
      return;
    } catch {
      decalLayer.innerHTML = '';
      return;
    }
  }

  decalLayer.innerHTML = '';
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
  const shapeLayer = document.getElementById('customizeShapes');
  const textLayer = document.getElementById('customizeTextLayer');
  const workspace = document.getElementById('customizerWorkspace');
  const productName = document.getElementById('customizeProductName');
  const productMeta = document.getElementById('customizeProductMeta');
  const modeEyebrow = document.getElementById('customizeModeEyebrow');
  const vehicleNote = document.getElementById('customizeVehicleNote');
  const backToProduct = document.getElementById('backToProduct');
  const continueToCheckout = document.getElementById('continueToCheckout');
  const downloadPreviewBtn = document.getElementById('downloadCustomizerPreview');
  const sharePreviewBtn = document.getElementById('shareCustomizerPreview');
  const fullscreenBtn = document.getElementById('toggleCustomizerFullscreen');

  if (!(form && baseImage && decalLayer && shapeLayer && textLayer && continueToCheckout)) return;

  if (typeof window.ensureProductsLoaded === 'function') {
    await window.ensureProductsLoaded();
  }

  const products = typeof window.getProductsList === 'function'
    ? window.getProductsList()
    : (window.PRODUCTS || []);
  const vehicleProduct = createVehicleKitFromCustomizeQuery();
  const productId = getCustomizeParam('productId');
  const selectedProduct = vehicleProduct || (typeof window.findProductById === 'function' ? window.findProductById(productId) : null);
  const initialProduct = selectedProduct || null;

  let activePremadeDecalId = '';
  let uploadedVehicleUrl = '';
  let decalRenderRequestId = 0;
  let originalShapeSnapshot = '';
  let undoStack = [];
  let redoStack = [];
  let activeShapeId = 'all';
  let decalObjectDragState = null;
  let editorShapes = [];
  let selectedEditorShapeId = '';
  let shapeObjectDragState = null;
  let premadeDecalOptions = PREMADE_DECAL_OPTIONS.slice();

  const selectedVehicle = vehicleProduct?.selectedVehicle || getVehicleFromCustomizeQuery() || (typeof window.getSelectedVehicle === 'function' ? window.getSelectedVehicle() : null);
  if (selectedVehicle && typeof window.setSelectedVehicle === 'function') {
    window.setSelectedVehicle(selectedVehicle);
  }

  try {
    const response = await fetch('/api/premade-decals');
    if (response.ok) {
      const options = await response.json();
      if (Array.isArray(options) && options.length) {
        premadeDecalOptions = options;
      }
    }
  } catch {
    premadeDecalOptions = PREMADE_DECAL_OPTIONS.slice();
  }

  const vehicleViewSelect = document.getElementById('vehicleViewSelect');
  const vehicleImageUpload = document.getElementById('vehicleImageUpload');
  const premadeDecalSelect = document.getElementById('premadeDecalSelect');
  const decalColorInput = document.getElementById('decalColor');
  const decalSizeInput = document.getElementById('decalSize');
  const decalRotateInput = document.getElementById('decalRotate');
  const decalXInput = document.getElementById('decalX');
  const decalYInput = document.getElementById('decalY');
  const shapeToolGrid = document.getElementById('shapeToolGrid');
  const editorShapeSelect = document.getElementById('editorShapeSelect');
  const editorShapeSizeInput = document.getElementById('editorShapeSize');
  const editorShapeRotateInput = document.getElementById('editorShapeRotate');
  const editorShapeFillInput = document.getElementById('editorShapeFill');
  const editorShapeStrokeInput = document.getElementById('editorShapeStroke');
  const editorShapeStrokeWidthInput = document.getElementById('editorShapeStrokeWidth');
  const editorStarPointsWrap = document.getElementById('editorStarPointsWrap');
  const editorStarPointsInput = document.getElementById('editorStarPoints');
  const deleteEditorShapeBtn = document.getElementById('deleteEditorShape');
  const shapeEditScopeInput = null;
  const shapeElementSelect = null;
  const shapeFillColorInput = null;
  const shapeStrokeColorInput = null;
  const shapeStrokeWidthInput = null;
  const undoShapeEditBtn = null;
  const redoShapeEditBtn = null;
  const resetShapeElementsBtn = null;
  const textInput = document.getElementById('designText');
  const textFontInput = document.getElementById('textFont');
  const textColorInput = document.getElementById('textColor');
  const textSizeInput = document.getElementById('textSize');
  const textRotateInput = document.getElementById('textRotate');
  const textXInput = document.getElementById('textX');
  const textYInput = document.getElementById('textY');

  function isCustomizerFullscreen() {
    return workspace?.classList.contains('is-fullscreen');
  }

  function setCustomizerFullscreenState(isFullscreen) {
    workspace?.classList.toggle('is-fullscreen', isFullscreen);
    document.body.classList.toggle('customizer-fullscreen', isFullscreen);
    if (fullscreenBtn) {
      fullscreenBtn.textContent = isFullscreen ? 'Exit Fullscreen' : 'Fullscreen';
      fullscreenBtn.setAttribute('aria-pressed', String(isFullscreen));
    }
  }

  async function enterCustomizerFullscreen() {
    setCustomizerFullscreenState(true);
    if (workspace?.requestFullscreen && document.fullscreenElement !== workspace) {
      try {
        await workspace.requestFullscreen();
      } catch {
        setCustomizerFullscreenState(true);
      }
    }
  }

  async function exitCustomizerFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch {
        setCustomizerFullscreenState(false);
      }
      return;
    }

    setCustomizerFullscreenState(false);
  }

  if (productName) productName.textContent = initialProduct?.name || 'Custom Decal Mockup';
  if (productMeta) {
    productMeta.textContent = 'Choose a premade decal to preview';
  }
  if (modeEyebrow) modeEyebrow.textContent = 'Premade Decals';
  if (backToProduct) backToProduct.href = initialProduct?.productUrl || (initialProduct?.id ? `product.html?id=${encodeURIComponent(initialProduct.id)}` : 'shop.html');
  if (vehicleNote) {
    vehicleNote.textContent = selectedVehicle?.label
      ? `Selected vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (${selectedVehicle.kitSku})` : ''}`
      : '';
  }

  function syncPremadeDecalOptions() {
    if (!premadeDecalSelect) return;

    const placeholderSelected = activePremadeDecalId ? '' : ' selected';
    const options = [`<option value=""${placeholderSelected}>Add a premade decal</option>`].concat(
      premadeDecalOptions.map((option) => {
        const selected = option.id === activePremadeDecalId ? ' selected' : '';
        return `<option value="${escapeHtml(option.id)}"${selected}>${escapeHtml(option.label)}</option>`;
      })
    );

    premadeDecalSelect.innerHTML = options.join('');
  }

  function getActiveDecalOption() {
    if (!activePremadeDecalId) return null;
    return premadeDecalOptions.find((option) => option.id === activePremadeDecalId) || null;
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

  function setDecalTransformInputs({ size, x, y, rotate }) {
    if (typeof size === 'number' && decalSizeInput) {
      decalSizeInput.value = String(Math.max(20, Math.min(140, Math.round(size))));
    }
    if (typeof rotate === 'number' && decalRotateInput) {
      let normalized = ((rotate + 180) % 360 + 360) % 360 - 180;
      decalRotateInput.value = String(Math.round(normalized));
    }
    if (typeof x === 'number' && decalXInput) {
      decalXInput.value = String(Math.max(-45, Math.min(45, Math.round(x))));
    }
    if (typeof y === 'number' && decalYInput) {
      decalYInput.value = String(Math.max(-45, Math.min(45, Math.round(y))));
    }
    updateTransforms();
  }

  function getSelectedEditorShape() {
    return editorShapes.find((shape) => shape.id === selectedEditorShapeId) || null;
  }

  function starPolygonPoints(points = 5) {
    const total = Math.max(4, Math.min(12, Number(points) || 5)) * 2;
    return Array.from({ length: total }, (_, index) => {
      const radius = index % 2 === 0 ? 42 : 19;
      const angle = -Math.PI / 2 + (index * Math.PI * 2) / total;
      return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
    }).join(' ');
  }

  function shapeMarkup(shape) {
    const common = `fill="${shape.fill}" stroke="${shape.stroke}" stroke-width="${shape.strokeWidth}" vector-effect="non-scaling-stroke"`;

    if (shape.type === 'circle') return `<circle cx="50" cy="50" r="38" ${common} />`;
    if (shape.type === 'triangle') return `<polygon points="50,10 92,88 8,88" ${common} />`;
    if (shape.type === 'star') return `<polygon points="${starPolygonPoints(shape.points)}" ${common} />`;
    if (shape.type === 'diamond') return `<polygon points="50,6 94,50 50,94 6,50" ${common} />`;
    if (shape.type === 'line') return `<line x1="10" y1="50" x2="90" y2="50" fill="none" stroke="${shape.stroke}" stroke-width="${Math.max(1, shape.strokeWidth)}" stroke-linecap="round" vector-effect="non-scaling-stroke" />`;
    return `<rect x="12" y="12" width="76" height="76" rx="2" ${common} />`;
  }

  function renderEditorShapes() {
    shapeLayer.innerHTML = editorShapes.map((shape) => `
      <div class="customizer-shape-object${shape.id === selectedEditorShapeId ? ' is-active' : ''}"
        data-shape-id="${shape.id}"
        style="width:${shape.size}px;height:${shape.size}px;transform:translate(-50%, -50%) translate(${shape.x}%, ${shape.y}%) rotate(${shape.rotate}deg);">
        <svg viewBox="0 0 100 100" aria-hidden="true">${shapeMarkup(shape)}</svg>
        <button type="button" class="customizer-shape-resize" aria-label="Resize shape"></button>
      </div>
    `).join('');
  }

  function syncEditorShapeControls() {
    const selectedShape = getSelectedEditorShape();

    if (editorShapeSelect) {
      const options = ['<option value="">No shape selected</option>'].concat(
        editorShapes.map((shape, index) => {
          const selected = shape.id === selectedEditorShapeId ? ' selected' : '';
          return `<option value="${shape.id}"${selected}>${titleCase(shape.type)} ${index + 1}</option>`;
        })
      );
      editorShapeSelect.innerHTML = options.join('');
      editorShapeSelect.value = selectedShape?.id || '';
    }

    [editorShapeSizeInput, editorShapeRotateInput, editorShapeFillInput, editorShapeStrokeInput, editorShapeStrokeWidthInput, editorStarPointsInput, deleteEditorShapeBtn].forEach((control) => {
      if (control) control.disabled = !selectedShape;
    });

    if (editorStarPointsWrap) editorStarPointsWrap.hidden = selectedShape?.type !== 'star';
    if (!selectedShape) return;

    if (editorShapeSizeInput) editorShapeSizeInput.value = String(selectedShape.size);
    if (editorShapeRotateInput) editorShapeRotateInput.value = String(selectedShape.rotate);
    if (editorShapeFillInput) editorShapeFillInput.value = selectedShape.fill;
    if (editorShapeStrokeInput) editorShapeStrokeInput.value = selectedShape.stroke;
    if (editorShapeStrokeWidthInput) editorShapeStrokeWidthInput.value = String(selectedShape.strokeWidth);
    if (editorStarPointsInput) editorStarPointsInput.value = String(selectedShape.points || 5);
  }

  function selectEditorShape(id) {
    selectedEditorShapeId = id || '';
    renderEditorShapes();
    syncEditorShapeControls();
  }

  function addEditorShape(type) {
    const shape = {
      id: `shape-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type,
      x: 0,
      y: 0,
      size: type === 'line' ? 150 : 96,
      rotate: 0,
      fill: editorShapeFillInput?.value || '#111111',
      stroke: editorShapeStrokeInput?.value || '#ffffff',
      strokeWidth: Number(editorShapeStrokeWidthInput?.value || 4),
      points: Number(editorStarPointsInput?.value || 5)
    };

    editorShapes.push(shape);
    selectEditorShape(shape.id);
  }

  function updateSelectedEditorShape(updates) {
    const selectedShape = getSelectedEditorShape();
    if (!selectedShape) return;
    Object.assign(selectedShape, updates);
    renderEditorShapes();
    syncEditorShapeControls();
  }

  function setEditorShapeFromPointer({ size, x, y }) {
    const selectedShape = getSelectedEditorShape();
    if (!selectedShape) return;

    if (typeof size === 'number') selectedShape.size = Math.max(24, Math.min(260, Math.round(size)));
    if (typeof x === 'number') selectedShape.x = Math.max(-55, Math.min(55, Math.round(x)));
    if (typeof y === 'number') selectedShape.y = Math.max(-55, Math.min(55, Math.round(y)));

    renderEditorShapes();
    syncEditorShapeControls();
  }

  function setDecalSelectionBounds(left, top, width, height) {
    decalLayer.style.setProperty('--selection-left', `${left}%`);
    decalLayer.style.setProperty('--selection-top', `${top}%`);
    decalLayer.style.setProperty('--selection-width', `${width}%`);
    decalLayer.style.setProperty('--selection-height', `${height}%`);
    decalLayer.style.setProperty('--selection-center-x', `${left + width / 2}%`);
  }

  function normalizeDecalSvgBounds() {
    const svg = decalLayer.querySelector('svg');
    if (!svg) return;

    try {
      const bbox = svg.getBBox();
      if (!(bbox.width && bbox.height)) return;

      const strokePadding = Math.max(1, Math.max(bbox.width, bbox.height) * 0.015);
      svg.setAttribute('viewBox', [
        bbox.x - strokePadding,
        bbox.y - strokePadding,
        bbox.width + strokePadding * 2,
        bbox.height + strokePadding * 2
      ].join(' '));
    } catch {
      // Keep the source viewBox if the browser cannot measure it yet.
    }
  }

  function updateDecalSelectionBounds() {
    const svg = decalLayer.querySelector('svg');
    const image = decalLayer.querySelector('.customizer-decal-image');
    if (image) {
      const measureImage = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = image.naturalWidth;
          const height = image.naturalHeight;
          if (!(width && height)) {
            setDecalSelectionBounds(0, 0, 100, 100);
            return;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(image, 0, 0);
          const pixels = ctx.getImageData(0, 0, width, height).data;
          let minX = width;
          let minY = height;
          let maxX = 0;
          let maxY = 0;

          for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
              if (pixels[(y * width + x) * 4 + 3] > 8) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }

          if (minX > maxX || minY > maxY) {
            setDecalSelectionBounds(0, 0, 100, 100);
            return;
          }

          setDecalSelectionBounds(
            (minX / width) * 100,
            (minY / height) * 100,
            ((maxX - minX + 1) / width) * 100,
            ((maxY - minY + 1) / height) * 100
          );
        } catch {
          setDecalSelectionBounds(0, 0, 100, 100);
        }
      };

      if (image.complete) {
        measureImage();
      } else {
        image.addEventListener('load', measureImage, { once: true });
        setDecalSelectionBounds(0, 0, 100, 100);
      }
      return;
    }

    if (!svg) {
      setDecalSelectionBounds(0, 0, 100, 100);
      return;
    }

    try {
      normalizeDecalSvgBounds();
      setDecalSelectionBounds(0, 0, 100, 100);
    } catch {
      setDecalSelectionBounds(0, 0, 100, 100);
    }
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
      mode: 'Premade Decal Mockup',
      decalName: option?.label || 'No premade decal selected',
      decalProductId: option?.id || '',
      decalColor: decalColorInput?.value || '#111111',
      decalSize: `${decalSizeInput?.value || '72'}%`,
      decalRotation: `${decalRotateInput?.value || '0'}deg`,
      decalPosition: `X ${decalXInput?.value || '0'}, Y ${decalYInput?.value || '0'}`,
      text: (textInput?.value || '').trim() || 'None',
      textColor: textColorInput?.value || '#7dff5a',
      textSize: textSizeInput?.value || '42',
      textFont: titleCase(textFontInput?.selectedOptions?.[0]?.textContent || 'Block'),
      shapes: editorShapes.map((shape) => `${titleCase(shape.type)} ${shape.size}px ${shape.fill} stroke ${shape.stroke} ${shape.strokeWidth}px`).join('; ') || 'None',
      vehicleImage: uploadedVehicleUrl ? 'Customer uploaded' : titleCase(vehicleViewSelect?.selectedOptions?.[0]?.textContent || 'Default'),
      placementPreset: 'Custom',
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
    const decalImage = layer.querySelector('.customizer-decal-image');
    if (!svg && !decalImage) return;

    const image = decalImage
      ? await loadImage(decalImage.currentSrc || decalImage.src)
      : await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString((() => {
        const exportSvg = svg.cloneNode(true);
        exportSvg.querySelectorAll('.is-selected-shape').forEach((shape) => shape.classList.remove('is-selected-shape'));
        return exportSvg;
      })()))}`);
    const rect = layerRectInStage(layer, stageRect, scale);
    ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  }

  async function drawEditorShapes(ctx, stageRect, scale) {
    for (const shape of editorShapes) {
      const svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shapeMarkup(shape)}</svg>`;
      const image = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`);
      const size = shape.size * scale;
      const centerX = (stageRect.width / 2 + (shape.x / 100) * shape.size) * scale;
      const centerY = (stageRect.height / 2 + (shape.y / 100) * shape.size) * scale;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((shape.rotate * Math.PI) / 180);
      ctx.drawImage(image, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
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
    await drawEditorShapes(ctx, stageRect, scale);
    drawTextLayer(ctx, textLayer, stageRect, scale);

    return canvas.toDataURL('image/png', 0.92);
  }

  async function updateDecal() {
    const requestId = ++decalRenderRequestId;
    const option = getActiveDecalOption();
    const fillColor = decalColorInput?.value || '#111111';

    if (productName) productName.textContent = option?.label || initialProduct?.name || 'Custom Decal Mockup';
    if (productMeta) {
      productMeta.textContent = option
        ? 'Drag the decal to move it. Drag the corner handle to resize it.'
        : 'Choose a premade decal to preview';
    }
    if (modeEyebrow) modeEyebrow.textContent = 'Premade Decals';

    await renderDecalLayer({ decalLayer, option, fillColor });
    if (requestId !== decalRenderRequestId) return;
    updateDecalSelectionBounds();
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

  syncPremadeDecalOptions();
  renderEditorShapes();
  syncEditorShapeControls();
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

  premadeDecalSelect?.addEventListener('change', () => {
    activePremadeDecalId = premadeDecalSelect.value || '';
    if (activePremadeDecalId) {
      if (decalSizeInput) decalSizeInput.value = '46';
      if (decalXInput) decalXInput.value = '0';
      if (decalYInput) decalYInput.value = '0';
      if (decalRotateInput) decalRotateInput.value = '0';
    }
    updateAll();
  });

  fullscreenBtn?.addEventListener('click', () => {
    if (isCustomizerFullscreen()) {
      exitCustomizerFullscreen();
    } else {
      enterCustomizerFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    setCustomizerFullscreenState(document.fullscreenElement === workspace);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isCustomizerFullscreen() && !document.fullscreenElement) {
      setCustomizerFullscreenState(false);
    }
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

  decalColorInput?.addEventListener('input', () => {
    updateDecal();
  });

  [decalSizeInput, decalRotateInput, decalXInput, decalYInput].forEach((input) => {
    input?.addEventListener('input', updateTransforms);
    input?.addEventListener('change', updateTransforms);
  });

  [textInput, textFontInput, textColorInput, textSizeInput, textRotateInput, textXInput, textYInput].forEach((input) => {
    input?.addEventListener('input', updateTransforms);
    input?.addEventListener('change', updateTransforms);
  });

  shapeToolGrid?.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-shape-type]');
    if (!button) return;
    addEditorShape(button.dataset.shapeType || 'square');
  });

  editorShapeSelect?.addEventListener('change', () => {
    selectEditorShape(editorShapeSelect.value || '');
  });

  editorShapeSizeInput?.addEventListener('input', () => {
    updateSelectedEditorShape({ size: Number(editorShapeSizeInput.value || 96) });
  });

  editorShapeRotateInput?.addEventListener('input', () => {
    updateSelectedEditorShape({ rotate: Number(editorShapeRotateInput.value || 0) });
  });

  editorShapeFillInput?.addEventListener('input', () => {
    updateSelectedEditorShape({ fill: editorShapeFillInput.value || '#111111' });
  });

  editorShapeStrokeInput?.addEventListener('input', () => {
    updateSelectedEditorShape({ stroke: editorShapeStrokeInput.value || '#ffffff' });
  });

  editorShapeStrokeWidthInput?.addEventListener('input', () => {
    updateSelectedEditorShape({ strokeWidth: Number(editorShapeStrokeWidthInput.value || 0) });
  });

  editorStarPointsInput?.addEventListener('input', () => {
    updateSelectedEditorShape({ points: Number(editorStarPointsInput.value || 5) });
  });

  deleteEditorShapeBtn?.addEventListener('click', () => {
    if (!selectedEditorShapeId) return;
    editorShapes = editorShapes.filter((shape) => shape.id !== selectedEditorShapeId);
    selectEditorShape(editorShapes[editorShapes.length - 1]?.id || '');
  });

  shapeLayer.addEventListener('pointerdown', (event) => {
    const object = event.target.closest?.('.customizer-shape-object');
    if (!object) return;

    event.preventDefault();
    selectEditorShape(object.dataset.shapeId || '');

    const selectedShape = getSelectedEditorShape();
    const stageRect = document.getElementById('customizeViewer')?.getBoundingClientRect();
    const objectRect = object.getBoundingClientRect();
    if (!selectedShape) return;

    shapeObjectDragState = {
      pointerId: event.pointerId,
      mode: event.target.closest?.('.customizer-shape-resize') ? 'resize' : 'move',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: selectedShape.x,
      startY: selectedShape.y,
      startSize: selectedShape.size,
      objectWidth: Math.max(1, objectRect.width),
      objectHeight: Math.max(1, objectRect.height),
      stageWidth: Math.max(1, stageRect?.width || 1)
    };
    shapeLayer.setPointerCapture?.(event.pointerId);
  });

  shapeLayer.addEventListener('pointermove', (event) => {
    if (!shapeObjectDragState || shapeObjectDragState.pointerId !== event.pointerId) return;

    const dx = event.clientX - shapeObjectDragState.startClientX;
    const dy = event.clientY - shapeObjectDragState.startClientY;

    if (shapeObjectDragState.mode === 'resize') {
      const dominantDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      setEditorShapeFromPointer({
        size: shapeObjectDragState.startSize + (dominantDelta / shapeObjectDragState.stageWidth) * 220
      });
      return;
    }

    setEditorShapeFromPointer({
      x: shapeObjectDragState.startX + (dx / shapeObjectDragState.objectWidth) * 100,
      y: shapeObjectDragState.startY + (dy / shapeObjectDragState.objectHeight) * 100
    });
  });

  ['pointerup', 'pointercancel'].forEach((eventName) => {
    shapeLayer.addEventListener(eventName, (event) => {
      if (!shapeObjectDragState || shapeObjectDragState.pointerId !== event.pointerId) return;
      shapeObjectDragState = null;
      shapeLayer.releasePointerCapture?.(event.pointerId);
    });
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
    if (!getActiveDecalOption()) return;

    event.preventDefault();
    const isResize = Boolean(event.target.closest?.('.customizer-resize-handle'));
    const isRotate = Boolean(event.target.closest?.('.customizer-rotate-handle'));
    const stageRect = document.getElementById('customizeViewer')?.getBoundingClientRect();
    const layerRect = decalLayer.getBoundingClientRect();
    const centerX = layerRect.left + layerRect.width / 2;
    const centerY = layerRect.top + layerRect.height / 2;
    decalObjectDragState = {
      pointerId: event.pointerId,
      mode: isRotate ? 'rotate' : isResize ? 'resize' : 'move',
      startClientX: event.clientX,
      startClientY: event.clientY,
      startSize: Number(decalSizeInput?.value || 72),
      startRotate: Number(decalRotateInput?.value || 0),
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI,
      centerX,
      centerY,
      startX: Number(decalXInput?.value || 0),
      startY: Number(decalYInput?.value || 0),
      layerWidth: Math.max(1, layerRect.width),
      layerHeight: Math.max(1, layerRect.height),
      stageWidth: Math.max(1, stageRect?.width || 1)
    };
    decalLayer.setPointerCapture?.(event.pointerId);
  });

  decalLayer.addEventListener('pointermove', (event) => {
    if (!decalObjectDragState || decalObjectDragState.pointerId !== event.pointerId) return;

    const dx = event.clientX - decalObjectDragState.startClientX;
    const dy = event.clientY - decalObjectDragState.startClientY;

    if (decalObjectDragState.mode === 'resize') {
      const dominantDelta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      setDecalTransformInputs({
        size: decalObjectDragState.startSize + (dominantDelta / decalObjectDragState.stageWidth) * 100
      });
      return;
    }

    if (decalObjectDragState.mode === 'rotate') {
      const angle = Math.atan2(event.clientY - decalObjectDragState.centerY, event.clientX - decalObjectDragState.centerX) * 180 / Math.PI;
      setDecalTransformInputs({
        rotate: decalObjectDragState.startRotate + angle - decalObjectDragState.startAngle
      });
      return;
    }

    setDecalTransformInputs({
      x: decalObjectDragState.startX + (dx / decalObjectDragState.layerWidth) * 100,
      y: decalObjectDragState.startY + (dy / decalObjectDragState.layerHeight) * 100
    });
  });

  ['pointerup', 'pointercancel'].forEach((eventName) => {
    decalLayer.addEventListener(eventName, (event) => {
      if (!decalObjectDragState || decalObjectDragState.pointerId !== event.pointerId) return;
      decalObjectDragState = null;
      decalLayer.releasePointerCapture?.(event.pointerId);
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
      `Shapes: ${settings.shapes}`,
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
