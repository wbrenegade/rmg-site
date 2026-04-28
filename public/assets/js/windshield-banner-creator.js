function initBannerCustomizer() {
  const overlay = document.getElementById('bannerTextOverlay');
  const form = document.getElementById('bannerCustomizerForm');
  const checkoutBtn = document.getElementById('bannerCheckoutBtn');
  if (!(overlay && form && checkoutBtn)) return;

  const textInput = document.getElementById('bannerText');
  const colorInput = document.getElementById('bannerColor');
  const outlineInput = document.getElementById('bannerOutline');
  const sizeInput = document.getElementById('bannerSize');
  const rotateInput = document.getElementById('bannerRotate');
  const posXInput = document.getElementById('bannerPosX');
  const posYInput = document.getElementById('bannerPosY');
  const spacingInput = document.getElementById('bannerSpacing');
  const opacityInput = document.getElementById('bannerOpacity');

  function renderOverlay() {
    const text = (textInput?.value || 'RENEGADE').trim() || 'RENEGADE';
    const color = colorInput?.value || '#ffffff';
    const outline = outlineInput?.value || '#000000';
    const size = Number(sizeInput?.value || 72);
    const rotate = Number(rotateInput?.value || 0);
    const posX = Number(posXInput?.value || 0);
    const posY = Number(posYInput?.value || -8);
    const spacing = Number(spacingInput?.value || 5);
    const opacity = Number(opacityInput?.value || 100) / 100;

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
      `Windshield banner customizer`,
      `Text: ${(textInput?.value || 'RENEGADE').trim() || 'RENEGADE'}`,
      `Color: ${colorInput?.value || '#ffffff'}`,
      `Outline: ${outlineInput?.value || '#000000'}`,
      `Size: ${sizeInput?.value || '72'}`,
      `Rotation: ${rotateInput?.value || '0'}deg`,
      `Position: X ${posXInput?.value || '0'}, Y ${posYInput?.value || '0'}`,
      `Spacing: ${spacingInput?.value || '5'}`,
      `Opacity: ${opacityInput?.value || '100'}%`
    ].join(' | ');

    const params = new URLSearchParams();
    params.set('customNote', summary);
    window.location.href = `checkout.html?${params.toString()}`;
  });

  renderOverlay();
}

document.addEventListener('DOMContentLoaded', initBannerCustomizer);
