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
    customizeUrl: `mustang-customizer.html?${query}`,
    selectedVehicle: { year, make, model, trim, kitSku, label }
  };
}

function renderVehicleContextNote() {
  const vehicle = typeof window.getSelectedVehicle === 'function' ? window.getSelectedVehicle() : null;
  if (!vehicle || !vehicle.label) return '';
  return `<p class="inline-note">Selected vehicle: ${vehicle.label}${vehicle.kitSku ? ` (${vehicle.kitSku})` : ''}</p>`;
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

  const imagePath = product.imagePath || '/assets/imgs/main.PNG';
  const imageAlt = product.imageLabel || product.name || 'Product preview';
  const customizeUrl = typeof window.buildCustomizeUrl === 'function'
    ? window.buildCustomizeUrl(product)
    : (product.customizeUrl || `mustang-customizer.html?productId=${encodeURIComponent(product.id)}`);
  const actions = product.custom
    ? `
        <a class="btn" href="${customizeUrl}">Customize</a>
        <a class="btn btn-outline" href="shop.html">Continue Shopping</a>
      `
    : `
        <button class="btn" onclick="addToCart('${product.id}')">Add to Cart</button>
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
}

document.addEventListener('DOMContentLoaded', initProductPage);