function getCustomizeParam(name) {
  return new URLSearchParams(window.location.search).get(name);
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
    price: 149.99,
    description: `Pre-cut tint kit matched for ${label}.`,
    imagePath: '/assets/imgs/main.PNG',
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

async function initCustomizePage() {
  const form = document.getElementById('customizeForm');
  const viewer = document.getElementById('customizeViewer');
  const baseImage = document.getElementById('customizeBaseImage');
  const decal = document.getElementById('customizeDecal');
  const productName = document.getElementById('customizeProductName');
  const productMeta = document.getElementById('customizeProductMeta');
  const vehicleNote = document.getElementById('customizeVehicleNote');
  const backToProduct = document.getElementById('backToProduct');
  const continueToCheckout = document.getElementById('continueToCheckout');

  if (!(form && viewer && baseImage && decal && continueToCheckout)) return;

  if (typeof window.ensureProductsLoaded === 'function') {
    await window.ensureProductsLoaded();
  }

  const vehicleProduct = createVehicleKitFromCustomizeQuery();
  const productId = getCustomizeParam('productId');
  const product = vehicleProduct || (typeof window.findProductById === 'function' ? window.findProductById(productId) : null) || PRODUCTS[0];

  const selectedVehicle = vehicleProduct?.selectedVehicle || getVehicleFromCustomizeQuery() || (typeof window.getSelectedVehicle === 'function' ? window.getSelectedVehicle() : null);
  if (selectedVehicle && typeof window.setSelectedVehicle === 'function') {
    window.setSelectedVehicle(selectedVehicle);
  }

  const textInput = document.getElementById('designText');
  const colorInput = document.getElementById('designColor');
  const opacityInput = document.getElementById('designOpacity');
  const sizeInput = document.getElementById('designSize');
  const rotateInput = document.getElementById('designRotate');
  const xInput = document.getElementById('designX');
  const yInput = document.getElementById('designY');
  const finishInput = document.getElementById('designFinish');
  const placementInput = document.getElementById('designPlacement');

  const previewText = textInput?.value || 'YOUR TEXT';
  decal.textContent = previewText;

  productName.textContent = product?.name || 'Custom Graphic';
  productMeta.textContent = `${product?.category || 'Custom Product'} • ${typeof window.formatCurrency === 'function' ? window.formatCurrency(product?.price || 0) : '$0.00'}`;
  baseImage.src = product?.imagePath || '/assets/imgs/main.PNG';
  baseImage.alt = product?.imageLabel || product?.name || 'Product preview';
  backToProduct.href = product?.productUrl || `product.html?id=${encodeURIComponent(product?.id || '')}`;

  if (vehicleNote) {
    vehicleNote.textContent = selectedVehicle?.label
      ? `Selected vehicle: ${selectedVehicle.label}${selectedVehicle.kitSku ? ` (${selectedVehicle.kitSku})` : ''}`
      : 'No vehicle selected. You can still customize and continue to checkout.';
  }

  function updatePreview() {
    decal.textContent = (textInput?.value || 'YOUR TEXT').toUpperCase();
    decal.style.color = colorInput?.value || '#7dff5a';
    decal.style.opacity = String((Number(opacityInput?.value || 90) / 100));
    decal.style.fontSize = `${Number(sizeInput?.value || 54)}px`;

    const x = Number(xInput?.value || 0);
    const y = Number(yInput?.value || 0);
    const rotate = Number(rotateInput?.value || 0);
    decal.style.transform = `translate(calc(-50% + ${x}%), calc(-50% + ${y}%)) rotate(${rotate}deg)`;
  }

  [textInput, colorInput, opacityInput, sizeInput, rotateInput, xInput, yInput].forEach((input) => {
    if (!input) return;
    input.addEventListener('input', updatePreview);
  });

  updatePreview();

  continueToCheckout.addEventListener('click', () => {
    const customizationSummary = [
      `Product: ${product?.name || 'Custom Graphic'}`,
      `Text: ${(textInput?.value || 'YOUR TEXT').trim() || 'YOUR TEXT'}`,
      `Color: ${colorInput?.value || '#7dff5a'}`,
      `Opacity: ${opacityInput?.value || '90'}%`,
      `Font size: ${sizeInput?.value || '54'}`,
      `Rotation: ${rotateInput?.value || '0'}deg`,
      `Position: X ${xInput?.value || '0'}, Y ${yInput?.value || '0'}`,
      `Finish: ${finishInput?.value || 'Gloss'}`,
      `Install side: ${placementInput?.value || 'Both sides'}`
    ];

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
