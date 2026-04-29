function initBannerCustomizer() {
  const BANNER_MOCKUPS = {
    windshield: {
      mustang: '/assets/imgs/mockups/banner-mockup/windshield/mustang.png',
      charger: '/assets/imgs/mockups/banner-mockup/windshield/charger.png',
      challenger: '/assets/imgs/mockups/banner-mockup/windshield/challeneger.png',
      subaru: '/assets/imgs/mockups/banner-mockup/windshield/subaru.png'
    },
    'rear-window': {
      mustang: '/assets/imgs/mockups/banner-mockup/rear-window/mustang.png',
      charger: '/assets/imgs/mockups/banner-mockup/rear-window/charger.png',
      challenger: '/assets/imgs/mockups/banner-mockup/rear-window/challenger.png',
      subaru: '/assets/imgs/mockups/banner-mockup/rear-window/subaru.png'
    }
  };

  const BANNER_VEHICLES = [
    { key: 'mustang', label: 'Mustang' },
    { key: 'charger', label: 'Charger' },
    { key: 'challenger', label: 'Challenger' },
    { key: 'subaru', label: 'Subaru' }
  ];

  const viewer = document.getElementById('bannerViewer');
  const vehicleImage = document.getElementById('bannerVehicleImage');
  const design = document.getElementById('bannerDesign');
  const guideX = document.getElementById('bannerGuideX');
  const guideY = document.getElementById('bannerGuideY');
  const svg = document.getElementById('bannerTextSvg');
  const curvePath = document.getElementById('bannerCurvePath');
  const textPath = document.getElementById('bannerTextPath');
  const textNode = document.getElementById('bannerTextNode');
  const form = document.getElementById('bannerCustomizerForm');
  const checkoutBtn = document.getElementById('bannerCheckoutBtn');
  if (!(viewer && vehicleImage && design && svg && curvePath && textPath && textNode && form && checkoutBtn && guideX && guideY)) return;

  const textInput = document.getElementById('bannerText');
  const colorInput = document.getElementById('bannerColor');
  const outlineInput = document.getElementById('bannerOutline');
  const fontInput = document.getElementById('bannerFont');
  const mockupTypeInput = document.getElementById('bannerMockupType');
  const vehicleInput = document.getElementById('bannerVehicle');
  const sizeInput = document.getElementById('bannerSize');
  const textWidthInput = document.getElementById('bannerTextWidth');
  const textHeightInput = document.getElementById('bannerTextHeight');
  const rotateInput = document.getElementById('bannerRotate');
  const posXInput = document.getElementById('bannerPosX');
  const posYInput = document.getElementById('bannerPosY');
  const spacingInput = document.getElementById('bannerSpacing');
  const curveInput = document.getElementById('bannerCurve');
  const opacityInput = document.getElementById('bannerOpacity');
  const undoBtn = document.getElementById('bannerUndoBtn');
  const redoBtn = document.getElementById('bannerRedoBtn');

  const controls = [
    {
      key: 'bannerText',
      element: textInput,
      format: (value) => `"${value}" (${String(value || '').length} chars)`
    },
    {
      key: 'bannerColor',
      element: colorInput,
      format: (value) => String(value || '#ffffff').toUpperCase()
    },
    {
      key: 'bannerOutline',
      element: outlineInput,
      format: (value) => String(value || '#000000').toUpperCase()
    },
    {
      key: 'bannerFont',
      element: fontInput,
      showMeta: false,
      showValue: false,
      format: (_, element) => element?.selectedOptions?.[0]?.textContent || 'Impact'
    },
    {
      key: 'bannerMockupType',
      element: mockupTypeInput,
      showMeta: false,
      showValue: false,
      format: (_, element) => element?.selectedOptions?.[0]?.textContent || 'Windshield'
    },
    {
      key: 'bannerVehicle',
      element: vehicleInput,
      showMeta: false,
      showValue: false,
      format: (_, element) => element?.selectedOptions?.[0]?.textContent || 'Mustang'
    },
    {
      key: 'bannerSize',
      element: sizeInput,
      format: (value) => {
        const px = Number(value || 72);
        return `${px}px (${(px / 96).toFixed(2)} in)`;
      }
    },
    {
      key: 'bannerTextWidth',
      element: textWidthInput,
      format: (value) => `${Number(value || 100)}%`
    },
    {
      key: 'bannerTextHeight',
      element: textHeightInput,
      format: (value) => `${Number(value || 100)}%`
    },
    {
      key: 'bannerRotate',
      element: rotateInput,
      format: (value) => `${Number(value || 0)} deg`
    },
    {
      key: 'bannerPosX',
      element: posXInput,
      format: (value) => `${Number(value || 0)}%`
    },
    {
      key: 'bannerPosY',
      element: posYInput,
      format: (value) => `${Number(value || 0)}%`
    },
    {
      key: 'bannerSpacing',
      element: spacingInput,
      format: (value) => `${Number(value || 0)} px`
    },
    {
      key: 'bannerCurve',
      element: curveInput,
      format: (value) => `${Number(value || 0)} deg`
    },
    {
      key: 'bannerOpacity',
      element: opacityInput,
      format: (value) => `${Number(value || 100)}%`
    }
  ].filter((item) => item.element);

  function captureControlState() {
    return controls.reduce((acc, item) => {
      acc[item.key] = item.element.value;
      return acc;
    }, {});
  }

  function applyControlState(state) {
    controls.forEach((item) => {
      if (state[item.key] !== undefined) {
        item.element.value = state[item.key];
      }
    });
  }

  function statesEqual(left, right) {
    return controls.every((item) => String(left[item.key]) === String(right[item.key]));
  }

  const initialState = captureControlState();
  let historyStack = [captureControlState()];
  let historyIndex = 0;
  let isApplyingHistory = false;

  function syncHistoryButtons() {
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = historyIndex >= historyStack.length - 1;
  }

  function pushHistoryState() {
    if (isApplyingHistory) return;

    const snapshot = captureControlState();
    if (statesEqual(snapshot, historyStack[historyIndex])) {
      syncHistoryButtons();
      return;
    }

    if (historyIndex < historyStack.length - 1) {
      historyStack = historyStack.slice(0, historyIndex + 1);
    }

    historyStack.push(snapshot);
    if (historyStack.length > 200) {
      historyStack.shift();
    } else {
      historyIndex += 1;
    }
    historyIndex = historyStack.length - 1;
    syncHistoryButtons();
  }

  function applyHistoryIndex(nextIndex) {
    if (nextIndex < 0 || nextIndex >= historyStack.length) return;
    historyIndex = nextIndex;
    isApplyingHistory = true;
    applyControlState(historyStack[historyIndex]);
    isApplyingHistory = false;
    renderOverlay();
    syncHistoryButtons();
  }

  function ensureControlMetaUI() {
    controls.forEach((item) => {
      if (item.showMeta === false) return;
      const label = item.element.closest('label');
      if (!label) return;

      let meta = label.querySelector(`.control-meta[data-control="${item.key}"]`);
      if (!meta) {
        meta = document.createElement('div');
        meta.className = 'control-meta';
        meta.dataset.control = item.key;

        if (item.showValue !== false) {
          const valueEl = document.createElement('span');
          valueEl.className = 'control-value';
          valueEl.id = `${item.key}Value`;
          meta.appendChild(valueEl);
        }

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'btn-reset';
        resetBtn.textContent = 'Reset';
        resetBtn.addEventListener('click', () => {
          const initialValue = initialState[item.key];
          if (initialValue === undefined) return;
          item.element.value = initialValue;
          renderOverlay();
          pushHistoryState();
        });

        meta.appendChild(resetBtn);
        label.appendChild(meta);
      }
    });
  }

  function updateControlMetaValues() {
    controls.forEach((item) => {
      const valueEl = document.getElementById(`${item.key}Value`);
      if (!valueEl) return;
      valueEl.textContent = item.format(item.element.value, item.element);
    });
  }

  function getCurrentMockupType() {
    const value = String(mockupTypeInput?.value || 'windshield').trim();
    return BANNER_MOCKUPS[value] ? value : 'windshield';
  }

  function populateVehicleOptions(preferredVehicleKey = 'mustang') {
    if (!vehicleInput) return;

    const activeType = getCurrentMockupType();
    const available = BANNER_MOCKUPS[activeType] || BANNER_MOCKUPS.windshield;
    const options = BANNER_VEHICLES.filter((item) => Boolean(available[item.key]));

    vehicleInput.innerHTML = options
      .map((item) => `<option value="${item.key}">${item.label}</option>`)
      .join('');

    const selectedKey = options.some((item) => item.key === preferredVehicleKey)
      ? preferredVehicleKey
      : (options[0]?.key || 'mustang');
    vehicleInput.value = selectedKey;
  }

  function getSelectedMockupImage() {
    const activeType = getCurrentMockupType();
    const selectedVehicle = String(vehicleInput?.value || 'mustang').trim();
    const typeMap = BANNER_MOCKUPS[activeType] || BANNER_MOCKUPS.windshield;
    const fallbackTypeMap = BANNER_MOCKUPS.windshield;

    return typeMap[selectedVehicle]
      || fallbackTypeMap[selectedVehicle]
      || fallbackTypeMap.mustang;
  }

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

  function applyTextStyles(text, color, outline, font, size, spacing, opacity) {
    textPath.textContent = text.toUpperCase();
    textNode.setAttribute('fill', color);
    textNode.setAttribute('stroke', outline);
    textNode.setAttribute('stroke-width', '2');
    textNode.style.fontSize = `${size}px`;
    textNode.style.letterSpacing = `${spacing}px`;
    textNode.style.fontFamily = font;
    textNode.style.fontWeight = '900';
    textNode.style.opacity = String(opacity);
  }

  function fitDesignToText(text, color, outline, font, size, spacing, curve, opacity, textWidthScale, textHeightScale) {
    const minWidth = 160;
    const minHeight = 90;
    const maxWidth = Math.max(minWidth, viewer.clientWidth - 18);
    const maxHeight = Math.max(minHeight, viewer.clientHeight - 18);
    const currentBaseWidth = design.offsetWidth / Math.max(textWidthScale, 0.01);
    const currentBaseHeight = design.offsetHeight / Math.max(textHeightScale, 0.01);

    let width = Math.min(
      Math.max(Math.max(currentBaseWidth, text.length * (size * 0.64)), minWidth),
      maxWidth
    );
    let height = Math.min(
      Math.max(Math.max(currentBaseHeight, size * 1.9), minHeight),
      maxHeight
    );

    for (let i = 0; i < 2; i += 1) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const y = height * 0.62;
      curvePath.setAttribute('d', `M 20 ${y} Q ${width / 2} ${y + curve} ${width - 20} ${y}`);
      applyTextStyles(text, color, outline, font, size, spacing, opacity);

      let bbox;
      try {
        bbox = textNode.getBBox();
      } catch {
        bbox = { width: width - 40, height: size * 1.1 };
      }

      const padX = Math.max(20, size * 0.34);
      const padY = Math.max(16, size * 0.3);
      const nextWidth = Math.min(Math.max(Math.ceil(bbox.width + (padX * 2)), minWidth), maxWidth);
      const nextHeight = Math.min(Math.max(Math.ceil(bbox.height + (padY * 2)), minHeight), maxHeight);

      if (Math.abs(nextWidth - width) < 1 && Math.abs(nextHeight - height) < 1) {
        break;
      }

      width = nextWidth;
      height = nextHeight;
    }

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const y = height * 0.62;
    curvePath.setAttribute('d', `M 20 ${y} Q ${width / 2} ${y + curve} ${width - 20} ${y}`);
    applyTextStyles(text, color, outline, font, size, spacing, opacity);

    return { width, height };
  }

  function renderOverlay() {
    const text = (textInput?.value || 'RENEGADE').trim() || 'RENEGADE';
    const color = colorInput?.value || '#ffffff';
    const outline = outlineInput?.value || '#000000';
    const font = fontInput?.value || "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif";
    const size = Number(sizeInput?.value || 72);
    const textWidthScale = Number(textWidthInput?.value || 100) / 100;
    const textHeightScale = Number(textHeightInput?.value || 100) / 100;
    const rotate = Number(rotateInput?.value || 0);
    let posX = Number(posXInput?.value || 0);
    let posY = Number(posYInput?.value || -8);
    const spacing = Number(spacingInput?.value || 5);
    const curve = Number(curveInput?.value || 0);
    const opacity = Number(opacityInput?.value || 100) / 100;

    const selectedType = getCurrentMockupType();
    const selectedVehicleImage = getSelectedMockupImage();
    vehicleImage.src = selectedVehicleImage;
    const selectedTypeLabel = mockupTypeInput?.selectedOptions?.[0]?.textContent || 'Windshield';
    vehicleImage.alt = `${vehicleInput?.selectedOptions?.[0]?.textContent || 'Mustang'} ${selectedTypeLabel.toLowerCase()} banner preview`;

    const { width: boxWidth, height: boxHeight } = fitDesignToText(
      text,
      color,
      outline,
      font,
      size,
      spacing,
      curve,
      opacity,
      textWidthScale,
      textHeightScale
    );
    design.style.width = `${boxWidth * textWidthScale}px`;
    design.style.height = `${boxHeight * textHeightScale}px`;

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
    applyTextStyles(text, color, outline, font, size, spacing, opacity);

    const offsetXpx = (posX / 100) * Math.max(viewer.clientWidth, 1);
    const offsetYpx = (posY / 100) * Math.max(viewer.clientHeight, 1);
    design.style.transform = `translate(calc(-50% + ${offsetXpx}px), calc(-50% + ${offsetYpx}px)) rotate(${rotate}deg)`;
    updateControlMetaValues();
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
    const hadInteraction = Boolean(dragState.mode);
    dragState.mode = null;
    design.classList.remove('dragging');
    setGuideState(false, false);
    if (hadInteraction) {
      pushHistoryState();
    }
  }

  design.addEventListener('pointerdown', (event) => {
    const handle = event.target.closest('.resize-handle');
    beginDrag(event, handle ? 'resize' : 'move');
  });
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', endPointerAction);

  if (mockupTypeInput) {
    mockupTypeInput.addEventListener('change', () => {
      const priorVehicle = String(vehicleInput?.value || 'mustang').trim();
      populateVehicleOptions(priorVehicle);
      renderOverlay();
      pushHistoryState();
    });
  }

  controls.forEach((item) => {
    item.element.addEventListener('input', () => {
      renderOverlay();
    });
    item.element.addEventListener('change', () => {
      pushHistoryState();
    });
  });

  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      applyHistoryIndex(historyIndex - 1);
    });
  }

  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      applyHistoryIndex(historyIndex + 1);
    });
  }

  window.addEventListener('keydown', (event) => {
    const isModifier = event.ctrlKey || event.metaKey;
    if (!isModifier || event.altKey) return;

    const key = String(event.key || '').toLowerCase();
    if (key !== 'z') return;

    const target = event.target;
    const targetTag = String(target?.tagName || '').toLowerCase();
    const isTypingTarget = targetTag === 'input' || targetTag === 'textarea' || target?.isContentEditable;
    const isBannerTextInput = target === textInput;

    if (isTypingTarget && !isBannerTextInput) return;

    event.preventDefault();
    if (event.shiftKey) {
      applyHistoryIndex(historyIndex + 1);
    } else {
      applyHistoryIndex(historyIndex - 1);
    }
  });

  checkoutBtn.addEventListener('click', () => {
    const summary = [
      `Banner customizer`,
      `Text: ${(textInput?.value || 'RENEGADE').trim() || 'RENEGADE'}`,
      `Color: ${colorInput?.value || '#ffffff'}`,
      `Outline: ${outlineInput?.value || '#000000'}`,
      `Font: ${fontInput?.selectedOptions?.[0]?.textContent || 'Impact'}`,
      `Mockup Type: ${mockupTypeInput?.selectedOptions?.[0]?.textContent || 'Windshield'}`,
      `Vehicle: ${vehicleInput?.selectedOptions?.[0]?.textContent || 'Mustang'}`,
      `Size: ${sizeInput?.value || '72'}`,
      `Text Width: ${textWidthInput?.value || '100'}%`,
      `Text Height: ${textHeightInput?.value || '100'}%`,
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

  ensureControlMetaUI();
  syncHistoryButtons();
  populateVehicleOptions(String(vehicleInput?.value || 'mustang').trim());
  renderOverlay();
}

document.addEventListener('DOMContentLoaded', initBannerCustomizer);
