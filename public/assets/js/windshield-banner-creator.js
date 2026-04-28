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
    startSize: 0,
    centerX: 0,
    centerY: 0,
    startDistance: 1
  };

  function getDragBounds() {
    const viewerWidth = Math.max(viewer.clientWidth, 1);
    const viewerHeight = Math.max(viewer.clientHeight, 1);
    const designWidth = Math.max(design.offsetWidth, 1);
    const designHeight = Math.max(design.offsetHeight, 1);

    const maxOffsetX = Math.max((viewerWidth - designWidth) / 2, 0);
    const maxOffsetY = Math.max((viewerHeight - designHeight) / 2, 0);
    const maxX = Math.max(35, Math.min(220, Math.floor((maxOffsetX / viewerWidth) * 100)));
    const maxY = Math.max(35, Math.min(220, Math.floor((maxOffsetY / viewerHeight) * 100)));

    return {
      minX: -maxX,
      maxX,
      minY: -maxY,
      maxY
    };
  }

  function syncPositionInputBounds(bounds) {
    posXInput.min = String(bounds.minX);
    posXInput.max = String(bounds.maxX);
    posYInput.min = String(bounds.minY);
    posYInput.max = String(bounds.maxY);
  }

  function clampPosition(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function snapPosition(value, min, max) {
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
      value: clampPosition(snappedValue, min, max),
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
    let posX = Number(posXInput?.value || 0);
    let posY = Number(posYInput?.value || -8);
    const spacing = Number(spacingInput?.value || 5);
    const curve = Number(curveInput?.value || 0);
    const opacity = Number(opacityInput?.value || 100) / 100;

    const textLength = Math.max(text.length, 4);
    const boxWidth = Math.min(Math.max(textLength * (size * 0.68), 220), Math.max(viewer.clientWidth - 30, 220));
    const boxHeight = Math.max(120, size * 2.1);
    design.style.width = `${boxWidth}px`;
    design.style.height = `${boxHeight}px`;

    const bounds = getDragBounds();
    syncPositionInputBounds(bounds);
    posX = clampPosition(posX, bounds.minX, bounds.maxX);
    posY = clampPosition(posY, bounds.minY, bounds.maxY);
    posXInput.value = String(Math.round(posX));
    posYInput.value = String(Math.round(posY));

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

    const offsetXpx = (posX / 100) * Math.max(viewer.clientWidth, 1);
    const offsetYpx = (posY / 100) * Math.max(viewer.clientHeight, 1);
    design.style.transform = `translate(calc(-50% + ${offsetXpx}px), calc(-50% + ${offsetYpx}px)) rotate(${rotate}deg)`;
  }

  function beginDrag(event, mode) {
    dragState.mode = mode;
    dragState.startX = event.clientX;
    dragState.startY = event.clientY;
    dragState.startPosX = Number(posXInput?.value || 0);
    dragState.startPosY = Number(posYInput?.value || 0);
    dragState.startSize = Number(sizeInput?.value || 72);

    if (mode === 'resize') {
      const rect = design.getBoundingClientRect();
      dragState.centerX = rect.left + (rect.width / 2);
      dragState.centerY = rect.top + (rect.height / 2);
      dragState.startDistance = Math.max(
        1,
        Math.hypot(event.clientX - dragState.centerX, event.clientY - dragState.centerY)
      );
    }

    design.classList.add('dragging');
    event.preventDefault();
  }

  function onPointerMove(event) {
    if (!dragState.mode) return;
    const dx = event.clientX - dragState.startX;
    const dy = event.clientY - dragState.startY;
    const disableSnap = Boolean(event.altKey);
    const bounds = getDragBounds();
    syncPositionInputBounds(bounds);

    if (dragState.mode === 'move') {
      const nextX = dragState.startPosX + ((dx / Math.max(viewer.clientWidth, 1)) * 100);
      const nextY = dragState.startPosY + ((dy / Math.max(viewer.clientHeight, 1)) * 100);

      if (disableSnap) {
        posXInput.value = String(Math.round(clampPosition(nextX, bounds.minX, bounds.maxX)));
        posYInput.value = String(Math.round(clampPosition(nextY, bounds.minY, bounds.maxY)));
        setGuideState(false, false);
      } else {
        const snappedX = snapPosition(nextX, bounds.minX, bounds.maxX);
        const snappedY = snapPosition(nextY, bounds.minY, bounds.maxY);
        posXInput.value = String(Math.round(snappedX.value));
        posYInput.value = String(Math.round(snappedY.value));
        setGuideState(snappedY.center, snappedX.center);
      }
    } else {
      const currentDistance = Math.max(
        1,
        Math.hypot(event.clientX - dragState.centerX, event.clientY - dragState.centerY)
      );
      const scale = currentDistance / dragState.startDistance;
      const nextSize = dragState.startSize * scale;
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
