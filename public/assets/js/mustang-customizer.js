function initMustangCustomizer() {
  const overlay = document.getElementById('mustangTextOverlay');
  const form = document.getElementById('mustangCustomizerForm');
  const checkoutBtn = document.getElementById('mustangCheckoutBtn');
  if (!(overlay && form && checkoutBtn)) return;

  const textInput = document.getElementById('mustangText');
  const colorInput = document.getElementById('mustangColor');
  const outlineInput = document.getElementById('mustangOutline');
  const sizeInput = document.getElementById('mustangSize');
  const rotateInput = document.getElementById('mustangRotate');
  const posXInput = document.getElementById('mustangPosX');
  const posYInput = document.getElementById('mustangPosY');
  const spacingInput = document.getElementById('mustangSpacing');
  const opacityInput = document.getElementById('mustangOpacity');

  function renderOverlay() {
    const text = (textInput?.value || 'RENEGADE').trim() || 'RENEGADE';
    const color = colorInput?.value || '#7dff5a';
    const outline = outlineInput?.value || '#081108';
    const size = Number(sizeInput?.value || 78);
    const rotate = Number(rotateInput?.value || -4);
    const posX = Number(posXInput?.value || 0);
    const posY = Number(posYInput?.value || 0);
    const spacing = Number(spacingInput?.value || 4);
    const opacity = Number(opacityInput?.value || 95) / 100;

    overlay.textContent = text.toUpperCase();
    overlay.style.color = color;
    overlay.style.fontSize = `${size}px`;
    overlay.style.letterSpacing = `${spacing}px`;
    overlay.style.opacity = String(opacity);
    overlay.style.textShadow = `
      -2px -2px 0 ${outline},
      2px -2px 0 ${outline},
      -2px 2px 0 ${outline},
      2px 2px 0 ${outline},
      0 4px 10px rgba(0, 0, 0, 0.45)
    `;
    overlay.style.transform = `translate(calc(-50% + ${posX}%), calc(-50% + ${posY}%)) rotate(${rotate}deg)`;
  }

  [
    textInput,
    colorInput,
    outlineInput,
    sizeInput,
    rotateInput,
    posXInput,
    posYInput,
    spacingInput,
    opacityInput
  ].forEach((control) => {
    if (!control) return;
    control.addEventListener('input', renderOverlay);
  });

  checkoutBtn.addEventListener('click', () => {
    const summary = [
      `Mustang customizer`,
      `Text: ${(textInput?.value || 'RENEGADE').trim() || 'RENEGADE'}`,
      `Color: ${colorInput?.value || '#7dff5a'}`,
      `Outline: ${outlineInput?.value || '#081108'}`,
      `Size: ${sizeInput?.value || '78'}`,
      `Rotation: ${rotateInput?.value || '-4'}deg`,
      `Position: X ${posXInput?.value || '0'}, Y ${posYInput?.value || '0'}`,
      `Spacing: ${spacingInput?.value || '4'}`,
      `Opacity: ${opacityInput?.value || '95'}%`
    ].join(' | ');

    const params = new URLSearchParams();
    params.set('customNote', summary);
    window.location.href = `checkout.html?${params.toString()}`;
  });

  renderOverlay();
}

document.addEventListener('DOMContentLoaded', initMustangCustomizer);
