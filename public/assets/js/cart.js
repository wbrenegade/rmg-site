function changeQuantityByKey(encodedCartKey, delta) {
  const cartKey = decodeURIComponent(encodedCartKey || '');
  const cart = getCart()
    .map(item => ((item.cartKey || item.id) === cartKey ? { ...item, quantity: item.quantity + delta } : item))
    .filter(item => item.quantity > 0);
  setCart(cart);
  renderCartPage();
}

function removeFromCartByKey(encodedCartKey) {
  const cartKey = decodeURIComponent(encodedCartKey || '');
  const cart = getCart().filter(item => (item.cartKey || item.id) !== cartKey);
  setCart(cart);
  renderCartPage();
}

function renderStripeOptionLines(item) {
  const options = item?.options;
  if (!options || typeof options !== 'object') return '';

  const widths = Array.isArray(options.stripeWidths) ? options.stripeWidths.filter(Boolean) : [];
  const colors = Array.isArray(options.stripeColors) ? options.stripeColors.filter(Boolean) : [];
  const lines = [];

  if (widths.length) lines.push(`Stripe Width: ${widths.join(', ')}`);
  if (colors.length) lines.push(`Stripe Color: ${colors.join(', ')}`);
  if (!lines.length) return '';

  return `<p class="inline-note">${lines.join(' • ')}</p>`;
}

function renderCartPage() {
  const cartItems = document.getElementById('cartItems');
  if (!cartItems) return;

  const cart = getCart();
  const totals = calculateCartTotals();

  if (!cart.length) {
    cartItems.innerHTML = '<div class="empty-state"><h3>Your cart is empty.</h3><p>Add some graphics and come back here to check out.</p><a class="btn" href="shop.html">Browse Products</a></div>';
  } else {
    cartItems.innerHTML = cart.map(item => {
      const product = findProductById(item.id);
      if (!product) return '';
      const cartKey = encodeURIComponent(item.cartKey || item.id);
      const optionLines = renderStripeOptionLines(item);
      return `
        <div class="cart-item">
          <div class="cart-row"><strong>${product.name}</strong><strong>${formatCurrency(product.price * item.quantity)}</strong></div>
          <p>${product.category} • ${formatCurrency(product.price)} each</p>
          ${optionLines}
          <div class="cart-row">
            <div class="qty-controls">
              <button onclick="changeQuantityByKey('${cartKey}', -1)">−</button>
              <span>${item.quantity}</span>
              <button onclick="changeQuantityByKey('${cartKey}', 1)">+</button>
            </div>
            <button class="btn btn-outline" onclick="removeFromCartByKey('${cartKey}')">Remove</button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('cartSubtotal').textContent = formatCurrency(totals.subtotal);
  document.getElementById('cartTax').textContent = formatCurrency(totals.tax);
  document.getElementById('cartTotal').textContent = formatCurrency(totals.total);
}

document.addEventListener('DOMContentLoaded', renderCartPage);