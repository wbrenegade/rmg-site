const STORAGE_KEYS = {
  cart: 'rmg_cart',
  users: 'rmg_users',
  currentUser: 'rmg_current_user',
  orders: 'rmg_orders',
  messages: 'rmg_messages',
  selectedVehicle: 'rmg_selected_vehicle'
};

let productsCache = [];
let productsLoadPromise = null;

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

const RMGApi = {
  async getProducts() {
    return requestJson('/api/products');
  },
  async getCategories() {
    return requestJson('/api/categories');
  },
  async getVehicleCatalog() {
    return requestJson('/api/vehicles/catalog');
  },
  async signup(data) {
    return requestJson('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async login(data) {
    return requestJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async getOrdersByUser(userId) {
    const query = encodeURIComponent(userId || '');
    return requestJson(`/api/orders?userId=${query}`);
  },
  async createOrder(data) {
    return requestJson('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async createMessage(data) {
    return requestJson('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  async trackAnalytics(data) {
    return requestJson('/api/analytics/events', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};

window.RMGApi = RMGApi;

function trackAnalyticsEvent(event) {
  if (!event || typeof event !== 'object') {
    return Promise.resolve();
  }

  return fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pathname: window.location.pathname,
      ...event
    }),
    keepalive: true
  }).catch(() => undefined);
}

window.RMGAnalytics = {
  track: trackAnalyticsEvent,
  trackProductView(product) {
    if (!product?.id) return Promise.resolve();
    return trackAnalyticsEvent({
      type: 'product_view',
      productId: product.id,
      productName: product.name || product.id,
      payload: {
        category: product.category || '',
        subcategory: product.subcategory || ''
      }
    });
  },
  trackTool(tool, action, payload = {}) {
    if (!tool || !action) return Promise.resolve();
    return trackAnalyticsEvent({
      type: 'tool_event',
      tool,
      action,
      payload
    });
  }
};

function getStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getProductsList() {
  return productsCache;
}

window.getProductsList = getProductsList;

async function ensureProductsLoaded() {
  if (productsLoadPromise) return productsLoadPromise;

  productsLoadPromise = RMGApi.getProducts()
    .then((apiProducts) => {
      if (Array.isArray(apiProducts) && apiProducts.length) {
        productsCache = apiProducts;
      }
      return productsCache;
    })
    .catch(() => productsCache)
    .finally(() => {
      productsLoadPromise = null;
    });

  return productsLoadPromise;
}

window.ensureProductsLoaded = ensureProductsLoaded;

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function getCart() {
  return getStorage(STORAGE_KEYS.cart, []);
}

function setCart(cart) {
  setStorage(STORAGE_KEYS.cart, cart);
  updateCartCount();
}

function normalizeCartOptions(options) {
  if (!options || typeof options !== 'object') return null;

  const normalized = {};
  const stripeWidths = Array.isArray(options.stripeWidths)
    ? options.stripeWidths.map(value => String(value || '').trim()).filter(Boolean)
    : [];
  const stripeColors = Array.isArray(options.stripeColors)
    ? options.stripeColors.map(value => String(value || '').trim()).filter(Boolean)
    : [];

  if (stripeWidths.length) normalized.stripeWidths = stripeWidths;
  if (stripeColors.length) normalized.stripeColors = stripeColors;

  return Object.keys(normalized).length ? normalized : null;
}

function buildCartItemKey(productId, options) {
  const normalizedOptions = normalizeCartOptions(options);
  if (!normalizedOptions) return productId;

  const optionKey = Object.keys(normalizedOptions)
    .sort()
    .map(key => `${key}:${normalizedOptions[key].join('|')}`)
    .join(';');

  return `${productId}::${optionKey}`;
}

function findProductById(id) {
  return getProductsList().find(product => product.id === id);
}

function getSelectedVehicle() {
  return getStorage(STORAGE_KEYS.selectedVehicle, null);
}

function setSelectedVehicle(vehicle) {
  if (!vehicle || !vehicle.year || !vehicle.make || !vehicle.model) {
    localStorage.removeItem(STORAGE_KEYS.selectedVehicle);
    return;
  }

  const normalized = {
    year: String(vehicle.year),
    make: String(vehicle.make),
    model: String(vehicle.model),
    trim: vehicle.trim ? String(vehicle.trim) : '',
    kitSku: vehicle.kitSku ? String(vehicle.kitSku) : '',
    label: [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')
  };
  setStorage(STORAGE_KEYS.selectedVehicle, normalized);
}

window.getSelectedVehicle = getSelectedVehicle;
window.setSelectedVehicle = setSelectedVehicle;

function addToCart(productId, quantity = 1, options = null) {
  const cart = getCart();
  const normalizedOptions = normalizeCartOptions(options);
  const cartKey = buildCartItemKey(productId, normalizedOptions);
  const existing = cart.find(item => (item.cartKey || item.id) === cartKey);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: productId,
      quantity,
      cartKey,
      ...(normalizedOptions ? { options: normalizedOptions } : {})
    });
  }
  setCart(cart);
  showMessage('Item added to cart.', 'success');
}

function updateCartCount() {
  const count = getCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
}

function calculateCartTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, item) => {
    const product = findProductById(item.id);
    return sum + ((product?.price || 0) * item.quantity);
  }, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  return { subtotal, tax, total };
}

function buildCustomizeUrl(product) {
  if (!product) return 'mustang-customizer.html';
  if (product.customizeUrl) return product.customizeUrl;
  const params = new URLSearchParams({ productId: product.id });
  return `mustang-customizer.html?${params.toString()}`;
}

window.buildCustomizeUrl = buildCustomizeUrl;

function renderProductCard(product) {
  const imagePath = product.imagePath || '/assets/imgs/main.PNG';
  const imageAlt = product.imageLabel || product.name || 'Product preview';
  const detailsUrl = product.productUrl || `product.html?id=${product.id}`;
  const customizeUrl = buildCustomizeUrl(product);
  const primaryAction = `<a href="${detailsUrl}" class="btn btn-outline">View Details</a>`;
  const secondaryAction = product.custom
    ? `<a href="${customizeUrl}" class="btn">Customize</a>`
    : `<button class="btn" onclick="addToCart('${product.id}')">Add to Cart</button>`;
  return `
    <article class="card product-card">
      <div class="product-media">
        <img src="${imagePath}" alt="${imageAlt}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <span class="media-fallback">${imageAlt}</span>
      </div>
      <div class="product-body">
        <span class="badge">${product.category}</span>
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <span class="product-price">${formatCurrency(product.price)}</span>
        </div>
        <div class="product-actions">
          ${primaryAction}
          ${secondaryAction}
        </div>
      </div>
    </article>
  `;
}

function renderFeaturedProducts(targetId, limit = 3) {
  const target = document.getElementById(targetId);
  if (!target) return;

  const render = () => {
    target.innerHTML = getProductsList().filter(product => product.featured).slice(0, limit).map(renderProductCard).join('');
  };

  render();
  ensureProductsLoaded().then(render).catch(() => {});
}

function showMessage(text, type = 'success', targetSelector = 'body') {
  const host = targetSelector === 'body' ? document.body : document.querySelector(targetSelector) || document.body;
  const message = document.createElement('div');
  message.className = `message ${type}`;
  message.textContent = text;
  if (targetSelector === 'body') {
    message.style.position = 'fixed';
    message.style.right = '16px';
    message.style.bottom = '16px';
    message.style.zIndex = '1000';
  }
  host.prepend(message);
  setTimeout(() => message.remove(), 2500);
}

function getCurrentUser() {
  return getStorage(STORAGE_KEYS.currentUser, null);
}

function setCurrentUser(user) {
  setStorage(STORAGE_KEYS.currentUser, user);
}

function ensureDemoSeedData() {
  if (!getStorage(STORAGE_KEYS.users, null)) setStorage(STORAGE_KEYS.users, []);
  if (!getStorage(STORAGE_KEYS.orders, null)) setStorage(STORAGE_KEYS.orders, []);
  if (!getStorage(STORAGE_KEYS.messages, null)) setStorage(STORAGE_KEYS.messages, []);
}

function initNav() {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('siteNav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => nav.classList.toggle('open'));
}

function updateYear() {
  document.querySelectorAll('#year').forEach(el => el.textContent = new Date().getFullYear());
}

document.addEventListener('DOMContentLoaded', () => {
  ensureDemoSeedData();
  initNav();
  ensureProductsLoaded();
  updateCartCount();
  updateYear();

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(contactForm).entries());
      try {
        await RMGApi.createMessage(data);
      } catch {
        const messages = getStorage(STORAGE_KEYS.messages, []);
        messages.unshift({ ...data, createdAt: new Date().toISOString() });
        setStorage(STORAGE_KEYS.messages, messages);
      }
      contactForm.reset();
      showMessage('Message sent successfully.', 'success');
    });
  }
});