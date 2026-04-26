function changeQuantity(productId, delta) {
  const cart = getCart().map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0);
  setCart(cart);
  renderCartPage();
}

function removeFromCart(productId) {
  const cart = getCart().filter(item => item.id !== productId);
  setCart(cart);
  renderCartPage();
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
      return `
        <div class="cart-item">
          <div class="cart-row"><strong>${product.name}</strong><strong>${formatCurrency(product.price * item.quantity)}</strong></div>
          <p>${product.category} • ${formatCurrency(product.price)} each</p>
          <div class="cart-row">
            <div class="qty-controls">
              <button onclick="changeQuantity('${product.id}', -1)">−</button>
              <span>${item.quantity}</span>
              <button onclick="changeQuantity('${product.id}', 1)">+</button>
            </div>
            <button class="btn btn-outline" onclick="removeFromCart('${product.id}')">Remove</button>
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