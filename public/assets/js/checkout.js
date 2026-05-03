function renderCheckoutSummary() {
  const summaryEl = document.getElementById('checkoutSummary');
  if (!summaryEl) return;

  const cart = getCart();
  const totals = calculateCartTotals();

  const renderStripeOptionLines = (item) => {
    const options = item?.options;
    if (!options || typeof options !== 'object') return '';

    const widths = Array.isArray(options.stripeWidths) ? options.stripeWidths.filter(Boolean) : [];
    const colors = Array.isArray(options.stripeColors) ? options.stripeColors.filter(Boolean) : [];
    const spacings = Array.isArray(options.stripeSpacings) ? options.stripeSpacings.filter(Boolean) : [];
    const outlineColors = Array.isArray(options.stripeOutlineColors) ? options.stripeOutlineColors.filter(Boolean) : [];
    const accentStyles = Array.isArray(options.stripeAccentStyles) ? options.stripeAccentStyles.filter(Boolean) : [];
    const accentSizes = Array.isArray(options.stripeAccentSizes) ? options.stripeAccentSizes.filter(Boolean) : [];
    const flameColors = Array.isArray(options.flameColors) ? options.flameColors.filter(Boolean) : [];
    const lines = [];

    if (widths.length) lines.push(`Stripe Width: ${widths.join(', ')}`);
    if (colors.length) lines.push(`Stripe Color: ${colors.join(', ')}`);
    if (spacings.length) lines.push(`Stripe Spacing: ${spacings.join(', ')}`);
    if (outlineColors.length) lines.push(`Accent Color: ${outlineColors.join(', ')}`);
    if (accentStyles.length) lines.push(`Accent Style: ${accentStyles.join(', ')}`);
    if (accentSizes.length) lines.push(`Accent Size: ${accentSizes.join(', ')}`);
    if (flameColors.length) lines.push(`Flame Color: ${flameColors.join(', ')}`);

    if (!lines.length) return '';
    return `<p class="inline-note">${lines.join(' • ')}</p>`;
  };

  if (!cart.length) {
    summaryEl.innerHTML = '<div class="empty-state">Your cart is empty.</div>';
  } else {
    summaryEl.innerHTML = cart.map(item => {
      const product = findProductById(item.id);
      if (!product) return '';
      const optionLines = renderStripeOptionLines(item);
      return `
        <div class="order-summary-line-wrap">
          <div class="order-summary-line">
            <span>${product.name} × ${item.quantity}</span>
            <strong>${formatCurrency(product.price * item.quantity)}</strong>
          </div>
          ${optionLines}
        </div>
      `;
    }).join('');
  }

  document.getElementById('checkoutSubtotal').textContent = formatCurrency(totals.subtotal);
  document.getElementById('checkoutTax').textContent = formatCurrency(totals.tax);
  document.getElementById('checkoutTotal').textContent = formatCurrency(totals.total);
}

function getVehicleFromQuery() {
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

function getCustomizationNoteFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const note = params.get('customNote');
  return note ? String(note).trim() : '';
}

function applyVehicleContextToCheckout(form) {
  const queryVehicle = getVehicleFromQuery();
  if (queryVehicle && typeof window.setSelectedVehicle === 'function') {
    window.setSelectedVehicle(queryVehicle);
  }

  const selectedVehicle = typeof window.getSelectedVehicle === 'function'
    ? window.getSelectedVehicle()
    : null;

  const vehicleContextEl = document.getElementById('checkoutVehicleContext');
  if (vehicleContextEl) {
    if (selectedVehicle?.label) {
      vehicleContextEl.textContent = `Selected vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (${selectedVehicle.kitSku})` : ''}`;
    } else {
      vehicleContextEl.textContent = '';
    }
  }

  if (selectedVehicle?.label && form?.elements?.notes && !form.elements.notes.value.trim()) {
    form.elements.notes.value = `Vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (SKU: ${selectedVehicle.kitSku})` : ''}`;
  }

  return selectedVehicle;
}

function applyCustomizationContextToCheckout(form) {
  const customizationNote = getCustomizationNoteFromQuery();
  const customizationContextEl = document.getElementById('checkoutCustomizationContext');

  if (customizationContextEl) {
    customizationContextEl.textContent = customizationNote ? `Customization: ${customizationNote}` : '';
  }

  if (customizationNote && form?.elements?.notes) {
    const existing = form.elements.notes.value.trim();
    if (!existing.includes(customizationNote)) {
      form.elements.notes.value = existing
        ? `${existing}\nCustomization: ${customizationNote}`
        : `Customization: ${customizationNote}`;
    }
  }

  return customizationNote;
}

function initCheckout() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  renderCheckoutSummary();

  const currentUser = getCurrentUser();
  if (currentUser) {
    form.elements.firstName.value = currentUser.name.split(' ')[0] || '';
    form.elements.lastName.value = currentUser.name.split(' ').slice(1).join(' ') || '';
    form.elements.email.value = currentUser.email || '';
  }

  applyVehicleContextToCheckout(form);
  applyCustomizationContextToCheckout(form);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const cart = getCart();
    if (!cart.length) {
      showMessage('Your cart is empty.', 'error', '#checkoutForm');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const totals = calculateCartTotals();
    const current = getCurrentUser();
    const selectedVehicle = typeof window.getSelectedVehicle === 'function' ? window.getSelectedVehicle() : null;
    try {
      await window.RMGApi.createOrder({
        userId: current?.id || 'guest',
        customer: data,
        items: cart,
        vehicle: selectedVehicle,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total
      });
    } catch {
      const orders = getStorage(STORAGE_KEYS.orders, []);
      const order = {
        id: crypto.randomUUID(),
        userId: current?.id || 'guest',
        customer: data,
        items: cart,
        vehicle: selectedVehicle,
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        status: 'Pending Fulfillment',
        createdAt: new Date().toISOString()
      };
      orders.unshift(order);
      setStorage(STORAGE_KEYS.orders, orders);
    }

    setCart([]);
    form.reset();
    window.location.href = 'order-success.html';
  });
}

document.addEventListener('DOMContentLoaded', initCheckout);
