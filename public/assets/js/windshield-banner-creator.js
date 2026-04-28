function initBannerCustomizer() {
  const viewer = document.getElementById('bannerViewer');
  const design = document.getElementById('bannerDesign');
  const guideX = document.getElementById('bannerGuideX');
  const guideY = document.getElementById('bannerGuideY');
  const svg = document.getElementById('bannerTextSvg');
  const curvePath = document.getElementById('bannerCurvePath');
  const textPath = document.getElementById('bannerTextPath');
  const textNode = document.getElementById('bannerTextNode');
  const form = document.getElementById('bannerCustomizerForm');
  const checkoutBtn = document.getElementById('bannerCheckoutBtn');
  if (!(viewer && design && svg && curvePath && textPath && textNode && form && checkoutBtn && guideX && guideY)) return;

  const textInput = document.getElementById('bannerText');
  const colorInput = document.getElementById('bannerColor');
  const outlineInput = document.getElementById('bannerOutline');
  const fontInput = document.getElementById('bannerFont');
  const sizeInput = document.getElementById('bannerSize');
  const rotateInput = document.getElementById('bannerRotate');
  const posXInput = document.getElementById('bannerPosX');
  const posYInput = document.getElementById('bannerPosY');
  const spacingInput = document.getElementById('bannerSpacing');
  const curveInput = document.getElementById('bannerCurve');
  const opacityInput = document.getElementById('bannerOpacity');

  const dragState = {
    mode: null,
    startX: 0,
    startY: 0,
    startPosX: 0,
    startPosY: 0,
    startSize: 0
  };

  function clampPosition(value) {
    return Math.max(-35, Math.min(35, value));
  }

  function snapPosition(value) {
    const centerThreshold = 2;
    const gridStep = 5;
    const gridThreshold = 1.4;
    let snappedValue = value;
    let snappedToCenter = false;

    if (Math.abs(value) <= centerThreshold) {
      snappedValue = 0;
      snappedToCenter = true;
    } else {
      const nearestGrid = Math.round(value / gridStep) * gridStep;
      if (Math.abs(value - nearestGrid) <= gridThreshold) {
        snappedValue = nearestGrid;
      }
    }

    return {
      value: clampPosition(snappedValue),
      center: snappedToCenter
    };
  }

  function setGuideState(showHorizontal, showVertical) {
    guideX.classList.toggle('active', Boolean(showHorizontal));
    guideY.classList.toggle('active', Boolean(showVertical));
  }

  function renderOverlay() {
    const text = (textInput?.value || 'RENEGADE').trim() || 'RENEGADE';
    const color = colorInput?.value || '#ffffff';
    const outline = outlineInput?.value || '#000000';
    const font = fontInput?.value || "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
    const size = Number(sizeInput?.value || 72);
    const rotate = Number(rotateInput?.value || 0);
    const posX = Number(posXInput?.value || 0);
    const posY = Number(posYInput?.value || -8);
    const spacing = Number(spacingInput?.value || 5);
    const curve = Number(curveInput?.value || 0);
    const opacity = Number(opacityInput?.value || 100) / 100;

    const textLength = Math.max(text.length, 4);
    const boxWidth = Math.min(Math.max(textLength * (size * 0.68), 220), Math.max(viewer.clientWidth - 30, 220));
    const boxHeight = Math.max(120, size * 2.1);
    design.style.width = `${boxWidth}px`;
    design.style.height = `${boxHeight}px`;

    svg.setAttribute('viewBox', `0 0 ${boxWidth} ${boxHeight}`);
    const y = boxHeight * 0.62;
    const controlY = y + curve;
    curvePath.setAttribute('d', `M 20 ${y} Q ${boxWidth / 2} ${controlY} ${boxWidth - 20} ${y}`);

    textPath.textContent = text.toUpperCase();
    textNode.setAttribute('fill', color);
    textNode.setAttribute('stroke', outline);
    textNode.setAttribute('stroke-width', '2');
    textNode.style.fontSize = `${size}px`;
    textNode.style.letterSpacing = `${spacing}px`;
    textNode.style.fontFamily = font;
    textNode.style.fontWeight = '900';
    textNode.style.opacity = String(opacity);

    design.style.transform = `translate(calc(-50% + ${posX}%), calc(-50% + ${posY}%)) rotate(${rotate}deg)`;
  }

  function beginDrag(event, mode) {
    dragState.mode = mode;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.startPosX = Number(posXInput?.value || 0);
    dragState.startPosY = Number(posYInput?.value || 0);
    dragState.startSize = Number(sizeInput?.value || 72);
    design.classList.add('dragging');
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!dragState.mode) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    const disableSnap = Boolean(event.altKey);

    if (dragState.mode === 'move') {
      const nextX = dragState.startPosX + ((dx / Math.max(viewer.clientWidth, 1)) * 100);
      const nextY = dragState.startPosY + ((dy / Math.max(viewer.clientHeight, 1)) * 100);

      if (disableSnap) {
        posXInput.value = String(Math.round(clampPosition(nextX)));
        posYInput.value = String(Math.round(clampPosition(nextY)));
        setGuideState(false, false);
      } else {
        const snappedX = snapPosition(nextX);
        const snappedY = snapPosition(nextY);
        posXInput.value = String(Math.round(snappedX.value));
        posYInput.value = String(Math.round(snappedY.value));
        setGuideState(snappedY.center, snappedX.center);
      }
    } else {
      const delta = Math.max(dx, -dy);
      const nextSize = dragState.startSize + (delta * 0.18);
      sizeInput.value = String(Math.max(28, Math.min(150, Math.round(nextSize))));
      setGuideState(false, false);
    }

    renderOverlay();
  }

  function endPointerAction() {
    dragState.mode = null;
    design.classList.remove('dragging');
    setGuideState(false, false);
  }

  design.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.resize-handle');
    beginDrag(event, handle ? 'resize' : 'move');
  });
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endPointerAction);

  [
    textInput,
    colorInput,
    outlineInput,
    fontInput,
    sizeInput,
    rotateInput,
    posXInput,
    posYInput,
    spacingInput,
    curveInput,
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
      `Font: ${fontInput?.selectedOptions?.[0]?.textContent || 'Impact'}`,
      `Size: ${sizeInput?.value || '72'}`,
      `Rotation: ${rotateInput?.value || '0'}deg`,
      `Position: X ${posXInput?.value || '0'}, Y ${posYInput?.value || '0'}`,
      `Spacing: ${spacingInput?.value || '5'}`,
      `Curve: ${curveInput?.value || '0'}`,
      `Opacity: ${opacityInput?.value || '100'}%`
    ].join(' | ');

    const params = new URLSearchParams();
    params.set('customNote', summary);
    window.location.href = `checkout.html?${params.toString()}`;
  });

  renderOverlay();
}

document.addEventListener('DOMContentLoaded', initBannerCustomizer);
