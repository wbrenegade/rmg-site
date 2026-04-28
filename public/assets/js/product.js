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
    name: `${label} Tint Kit`,
    slug: `${label} Tint Kit`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    category: 'Window Tint',
    subcategory: 'Precut Kits',
    subSubcategory: null,
    price: 149.99,
    tags: ['Window Tint', 'Precut Kits'].concat(kitSku ? [kitSku] : []),
    description: `Pre-cut tint kit matched for ${label}.`,
    imagePath: '/assets/imgs/main.PNG',
    imageLabel: `${label} Tint Kit`,
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

function getRacingStripeOptions(product) {
  const widthOptions = Array.isArray(product?.stripeOptions?.widths)
    ? product.stripeOptions.widths
    : ['8 in / 8 in', '10 in / 10 in', '12 in / 12 in', '10 in center + 2 in pinstripes'];
  const colorOptions = Array.isArray(product?.stripeOptions?.colors)
    ? product.stripeOptions.colors
    : ['Gloss Black', 'Matte Black', 'Satin Charcoal', 'Gloss White', 'Race Red', 'Nardo Gray'];

  return {
    widths: widthOptions.map(value => String(value || '').trim()).filter(Boolean),
    colors: colorOptions.map(value => String(value || '').trim()).filter(Boolean)
  };
}

function renderRacingStripeOptions(product) {
  if (!isRacingStripeProduct(product) || product.custom) return '';

  const options = getRacingStripeOptions(product);
  if (!options.widths.length || !options.colors.length) return '';

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
    </div>
  `;
}

function getSelectedRacingStripeOptions(container, product) {
  if (!isRacingStripeProduct(product) || product.custom) return null;

  const widthValue = container.querySelector('#stripeWidthSelect')?.value?.trim();
  const colorValue = container.querySelector('#stripeColorSelect')?.value?.trim();

  return {
    stripeWidths: widthValue ? [widthValue] : [],
    stripeColors: colorValue ? [colorValue] : []
  };
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
        ${renderVehicleContextNote()}
        <p class="inline-note">Open Customize to preview text, color, and layout before checkout.</p>
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
  if (addToCartButton) {
    addToCartButton.addEventListener('click', () => {
      const selectedOptions = getSelectedRacingStripeOptions(container, product);
      addToCart(product.id, 1, selectedOptions);
    });
  }
}

document.addEventListener('DOMContentLoaded', initProductPage);