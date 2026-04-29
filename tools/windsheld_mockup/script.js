const SVG_NS = 'http://www.w3.org/2000/svg';
const VIEWBOX_WIDTH = 1200;
const VIEWBOX_HEIGHT = 675;

const stage = document.getElementById('stage');
const carImage = document.getElementById('carImage');
const placeholder = document.getElementById('placeholder');
const bannerTransformGroup = document.getElementById('bannerTransformGroup');
const bannerPath = document.getElementById('bannerPath');
const bannerTextNode = document.getElementById('bannerTextNode');
const bannerTextPath = document.getElementById('bannerTextPath');
const dragHitbox = document.getElementById('dragHitbox');
const selectionBox = document.getElementById('selectionBox');

const imageUpload = document.getElementById('imageUpload');
const textInput = document.getElementById('textInput');
const colorInput = document.getElementById('colorInput');
const strokeColorInput = document.getElementById('strokeColorInput');
const fontSelect = document.getElementById('fontSelect');
const weightSelect = document.getElementById('weightSelect');
const sizeInput = document.getElementById('sizeInput');
const letterSpacingInput = document.getElementById('letterSpacingInput');
const wordSpacingInput = document.getElementById('wordSpacingInput');
const strokeWidthInput = document.getElementById('strokeWidthInput');
const curveInput = document.getElementById('curveInput');
const pathWidthInput = document.getElementById('pathWidthInput');
const xInput = document.getElementById('xInput');
const yInput = document.getElementById('yInput');
const rotateInput = document.getElementById('rotateInput');
const skewXInput = document.getElementById('skewXInput');
const skewYInput = document.getElementById('skewYInput');
const scaleXInput = document.getElementById('scaleXInput');
const scaleYInput = document.getElementById('scaleYInput');
const centerBtn = document.getElementById('centerBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');

const sizeValue = document.getElementById('sizeValue');
const letterSpacingValue = document.getElementById('letterSpacingValue');
const wordSpacingValue = document.getElementById('wordSpacingValue');
const strokeValue = document.getElementById('strokeValue');
const curveValue = document.getElementById('curveValue');
const pathWidthValue = document.getElementById('pathWidthValue');
const xValue = document.getElementById('xValue');
const yValue = document.getElementById('yValue');
const rotateValue = document.getElementById('rotateValue');
const skewXValue = document.getElementById('skewXValue');
const skewYValue = document.getElementById('skewYValue');
const scaleXValue = document.getElementById('scaleXValue');
const scaleYValue = document.getElementById('scaleYValue');

const defaultState = {
x: 600,
y: 120,
size: 72,
letterSpacing: 4,
wordSpacing: 8,
rotate: 0,
skewX: 0,
skewY: 0,
scaleX: 1,
scaleY: 1,
strokeWidth: 2,
color: '#ffffff',
strokeColor: '#000000',
font: fontSelect.value,
weight: weightSelect.value,
text: textInput.value.toUpperCase(),
image: 'assets/imgs/mockup.png',
curve: -36,
pathWidth: 640,
};
const state = { ...defaultState };
let autoFitScale = 1;

function updateLabels() {
sizeValue.textContent = state.size;
letterSpacingValue.textContent = state.letterSpacing;
wordSpacingValue.textContent = state.wordSpacing;
strokeValue.textContent = state.strokeWidth;
curveValue.textContent = state.curve;
pathWidthValue.textContent = Math.round(state.pathWidth);
xValue.textContent = Math.round(state.x);
yValue.textContent = Math.round(state.y);
rotateValue.textContent = state.rotate;
skewXValue.textContent = state.skewX;
skewYValue.textContent = state.skewY;
scaleXValue.textContent = Number(state.scaleX).toFixed(2);
scaleYValue.textContent = Number(state.scaleY).toFixed(2);
}

function setInputValuesFromState() {
textInput.value = state.text;
colorInput.value = state.color;
strokeColorInput.value = state.strokeColor;
fontSelect.value = state.font;
weightSelect.value = state.weight;
sizeInput.value = state.size;
letterSpacingInput.value = state.letterSpacing;
wordSpacingInput.value = state.wordSpacing;
strokeWidthInput.value = state.strokeWidth;
curveInput.value = state.curve;
pathWidthInput.value = state.pathWidth;
xInput.value = state.x;
yInput.value = state.y;
rotateInput.value = state.rotate;
skewXInput.value = state.skewX;
skewYInput.value = state.skewY;
scaleXInput.value = state.scaleX;
scaleYInput.value = state.scaleY;
}

function syncSliderBounds() {
xInput.max = String(VIEWBOX_WIDTH);
yInput.max = String(VIEWBOX_HEIGHT);
pathWidthInput.max = String(Math.round(Math.max(160, VIEWBOX_WIDTH * 0.96)));
if (state.pathWidth > Number(pathWidthInput.max)) state.pathWidth = Number(pathWidthInput.max);
}

function setCurvePath(width) {
const half = width / 2;
bannerPath.setAttribute('d', `M ${-half} 0 Q 0 ${state.curve} ${half} 0`);
}

function measurePathLength() {
try {
const measured = bannerPath.getTotalLength();
if (Number.isFinite(measured) && measured > 0) return measured;
} catch (_) {}
return state.pathWidth;
}

function estimateTextMetrics(effectiveWidth) {
setCurvePath(effectiveWidth);
let availableLength = measurePathLength();

let textLength = availableLength;
try {
const measured = bannerTextNode.getComputedTextLength();
if (Number.isFinite(measured) && measured > 0) textLength = measured;
} catch (_) {}

const fitPadding = Math.max(36, state.size * 0.55 + state.strokeWidth * 4);
const usableLength = Math.max(140, availableLength - fitPadding * 2);
const fittedWidth = Math.max(220, effectiveWidth * state.scaleX);
const fittedHeight = Math.max(110, (state.size * 1.1 + Math.abs(state.curve) + state.strokeWidth * 6) * state.scaleY);
return { fittedWidth, fittedHeight, usableLength, textLength, fitPadding, availableLength };
}

function updateHitbox(fittedWidth, fittedHeight) {
const boxWidth = Math.max(240, fittedWidth + state.size * 1.5);
const boxHeight = Math.max(150, fittedHeight + state.size * 1.2);
const boxX = -boxWidth / 2;
const boxY = -boxHeight / 2;
dragHitbox.setAttribute('x', `${boxX}`);
dragHitbox.setAttribute('y', `${boxY}`);
dragHitbox.setAttribute('width', `${boxWidth}`);
dragHitbox.setAttribute('height', `${boxHeight}`);
selectionBox.setAttribute('x', `${boxX}`);
selectionBox.setAttribute('y', `${boxY}`);
selectionBox.setAttribute('width', `${boxWidth}`);
selectionBox.setAttribute('height', `${boxHeight}`);
}

function clampPosition(fittedWidth, fittedHeight) {
const marginX = 14;
const marginY = 12;
const halfW = fittedWidth / 2;
const halfH = fittedHeight / 2;
state.x = Math.max(halfW + marginX, Math.min(state.x, VIEWBOX_WIDTH - halfW - marginX));
state.y = Math.max(halfH + marginY, Math.min(state.y, VIEWBOX_HEIGHT - halfH - marginY));
}

function render() {
syncSliderBounds();

bannerTextPath.textContent = state.text || ' ';
bannerTextNode.setAttribute('fill', state.color);
bannerTextNode.setAttribute('stroke', state.strokeColor);
bannerTextNode.setAttribute('stroke-width', state.strokeWidth);
bannerTextNode.setAttribute('font-size', `${state.size}px`);
bannerTextNode.setAttribute('font-family', state.font);
bannerTextNode.setAttribute('font-weight', state.weight);
bannerTextNode.setAttribute('letter-spacing', `${state.letterSpacing}px`);
bannerTextNode.setAttribute('word-spacing', `${state.wordSpacing}px`);
bannerTextNode.setAttribute('text-anchor', 'middle');
bannerTextNode.setAttribute('dominant-baseline', 'middle');

let effectiveWidth = state.pathWidth;
let metrics = estimateTextMetrics(effectiveWidth);

const neededStraightWidth = Math.max(
state.pathWidth,
metrics.textLength + metrics.fitPadding * 2 + Math.max(14, state.letterSpacing * Math.max(0, state.text.length - 1) * 0.35)
);

if (neededStraightWidth > effectiveWidth) {
effectiveWidth = Math.min(VIEWBOX_WIDTH - 28, neededStraightWidth);
metrics = estimateTextMetrics(effectiveWidth);
}

autoFitScale = 1;
bannerTextNode.removeAttribute('textLength');
bannerTextNode.removeAttribute('lengthAdjust');
bannerTextPath.setAttribute('startOffset', '50%');

clampPosition(metrics.fittedWidth, metrics.fittedHeight);
updateHitbox(metrics.fittedWidth, metrics.fittedHeight);

bannerTransformGroup.setAttribute(
'transform',
`translate(${state.x} ${state.y}) rotate(${state.rotate}) skewX(${state.skewX}) skewY(${state.skewY}) scale(${state.scaleX} ${state.scaleY})`
);

setInputValuesFromState();
updateLabels();
}

function showPlaceholder(show) {
placeholder.classList.toggle('hidden', !show);
}

function applyImage(src) {
state.image = src;
carImage.src = src;
carImage.style.display = 'block';
}

carImage.addEventListener('load', () => showPlaceholder(false));
carImage.addEventListener('error', () => {
carImage.style.display = 'none';
showPlaceholder(true);
});

function loadImage(file) {
const reader = new FileReader();
reader.onload = () => applyImage(reader.result);
reader.readAsDataURL(file);
}

imageUpload.addEventListener('change', (e) => {
const file = e.target.files[0];
if (file) loadImage(file);
});

textInput.addEventListener('input', () => { state.text = textInput.value.toUpperCase(); render(); });
colorInput.addEventListener('input', () => { state.color = colorInput.value; render(); });
strokeColorInput.addEventListener('input', () => { state.strokeColor = strokeColorInput.value; render(); });
fontSelect.addEventListener('change', () => { state.font = fontSelect.value; render(); });
weightSelect.addEventListener('change', () => { state.weight = weightSelect.value; render(); });
sizeInput.addEventListener('input', () => { state.size = Number(sizeInput.value); render(); });
letterSpacingInput.addEventListener('input', () => { state.letterSpacing = Number(letterSpacingInput.value); render(); });
wordSpacingInput.addEventListener('input', () => { state.wordSpacing = Number(wordSpacingInput.value); render(); });
strokeWidthInput.addEventListener('input', () => { state.strokeWidth = Number(strokeWidthInput.value); render(); });
curveInput.addEventListener('input', () => { state.curve = Number(curveInput.value); render(); });
pathWidthInput.addEventListener('input', () => { state.pathWidth = Number(pathWidthInput.value); render(); });
xInput.addEventListener('input', () => { state.x = Number(xInput.value); render(); });
yInput.addEventListener('input', () => { state.y = Number(yInput.value); render(); });
rotateInput.addEventListener('input', () => { state.rotate = Number(rotateInput.value); render(); });
skewXInput.addEventListener('input', () => { state.skewX = Number(skewXInput.value); render(); });
skewYInput.addEventListener('input', () => { state.skewY = Number(skewYInput.value); render(); });
scaleXInput.addEventListener('input', () => { state.scaleX = Number(scaleXInput.value); render(); });
scaleYInput.addEventListener('input', () => { state.scaleY = Number(scaleYInput.value); render(); });

centerBtn.addEventListener('click', () => {
state.x = VIEWBOX_WIDTH / 2;
state.y = Math.round(VIEWBOX_HEIGHT * 0.18);
render();
});

resetBtn.addEventListener('click', () => {
Object.assign(state, { ...defaultState, x: VIEWBOX_WIDTH / 2, y: Math.round(VIEWBOX_HEIGHT * 0.18) });
if (state.image) applyImage(state.image);
render();
});

let dragging = false;
let pointerId = null;
let startX = 0;
let startY = 0;
let originX = 0;
let originY = 0;
let pinchActive = false;
let pinchPointerIds = [];
let pinchStartDistance = 0;
let pinchStartScaleX = 1;
let pinchStartScaleY = 1;
const activePointers = new Map();

function getStagePoint(clientX, clientY) {
const rect = stage.getBoundingClientRect();
const x = ((clientX - rect.left) / rect.width) * VIEWBOX_WIDTH;
const y = ((clientY - rect.top) / rect.height) * VIEWBOX_HEIGHT;
return { x, y };
}

function getPointerDistance() {
if (pinchPointerIds.length < 2) return 0;
const first = activePointers.get(pinchPointerIds[0]);
const second = activePointers.get(pinchPointerIds[1]);
if (!first || !second) return 0;
const dx = second.clientX - first.clientX;
const dy = second.clientY - first.clientY;
return Math.hypot(dx, dy);
}

function beginDrag(clientX, clientY, id = 'mouse') {
pinchActive = false;
dragging = true;
pointerId = id;
bannerTransformGroup.classList.add('dragging');
const point = getStagePoint(clientX, clientY);
startX = point.x;
startY = point.y;
originX = state.x;
originY = state.y;
}

function continueDrag(clientX, clientY) {
if (!dragging || pinchActive) return;
const point = getStagePoint(clientX, clientY);
state.x = originX + (point.x - startX);
state.y = originY + (point.y - startY);
render();
}

function beginPinch() {
if (pinchPointerIds.length < 2) return;
pinchActive = true;
dragging = false;
pointerId = null;
pinchStartDistance = getPointerDistance();
pinchStartScaleX = state.scaleX;
pinchStartScaleY = state.scaleY;
bannerTransformGroup.classList.add('dragging');
}

function continuePinch() {
if (!pinchActive || pinchPointerIds.length < 2) return;
const distance = getPointerDistance();
if (!distance || !pinchStartDistance) return;
const ratio = distance / pinchStartDistance;
const nextScaleX = Math.min(3, Math.max(0.2, pinchStartScaleX * ratio));
const nextScaleY = Math.min(3, Math.max(0.2, pinchStartScaleY * ratio));
state.scaleX = Number(nextScaleX.toFixed(3));
state.scaleY = Number(nextScaleY.toFixed(3));
render();
}

function endDrag() {
dragging = false;
pointerId = null;
if (!pinchActive) {
bannerTransformGroup.classList.remove('dragging');
}
}

function clearPointer(pointerIdToRemove) {
activePointers.delete(pointerIdToRemove);
pinchPointerIds = pinchPointerIds.filter((id) => id !== pointerIdToRemove);

if (pinchActive) {
if (pinchPointerIds.length >= 2) {
pinchStartDistance = getPointerDistance();
pinchStartScaleX = state.scaleX;
pinchStartScaleY = state.scaleY;
return;
}
pinchActive = false;
bannerTransformGroup.classList.remove('dragging');
if (pinchPointerIds.length === 1) {
const remaining = activePointers.get(pinchPointerIds[0]);
if (remaining) {
beginDrag(remaining.clientX, remaining.clientY, remaining.pointerId);
}
return;
}
}

if (pointerId === pointerIdToRemove) {
endDrag();
}
}

function setSelected(selected) {
bannerTransformGroup.classList.toggle('selected', !!selected);
}

function handlePointerDown(e) {
e.preventDefault();
e.stopPropagation();
setSelected(true);
const target = e.currentTarget;
target.setPointerCapture?.(e.pointerId);
activePointers.set(e.pointerId, { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY });

if (!pinchPointerIds.includes(e.pointerId)) {
pinchPointerIds.push(e.pointerId);
}

if (pinchPointerIds.length >= 2) {
beginPinch();
return;
}

beginDrag(e.clientX, e.clientY, e.pointerId);
}

function handlePointerMove(e) {
if (activePointers.has(e.pointerId)) {
activePointers.set(e.pointerId, { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY });
}

if (pinchActive && pinchPointerIds.includes(e.pointerId)) {
continuePinch();
return;
}

if (pointerId !== null && e.pointerId !== pointerId) return;
continueDrag(e.clientX, e.clientY);
}

function handlePointerUpOrCancel(e) {
clearPointer(e.pointerId);
}

[dragHitbox, bannerTransformGroup, bannerTextNode, bannerTextPath].forEach((node) => {
node.addEventListener('pointerdown', handlePointerDown);
node.addEventListener('pointermove', handlePointerMove);
node.addEventListener('pointerup', handlePointerUpOrCancel);
node.addEventListener('pointercancel', handlePointerUpOrCancel);
});

stage.addEventListener('pointermove', handlePointerMove);
stage.addEventListener('pointerdown', (e) => {
if (!bannerTransformGroup.contains(e.target)) setSelected(false);
});
document.addEventListener('pointerdown', (e) => {
if (!bannerTransformGroup.contains(e.target)) setSelected(false);
});
stage.addEventListener('pointerup', handlePointerUpOrCancel);
stage.addEventListener('pointercancel', handlePointerUpOrCancel);
window.addEventListener('pointerup', handlePointerUpOrCancel);
window.addEventListener('pointercancel', handlePointerUpOrCancel);

function escapeXml(value) {
return String(value)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;')
.replace(/'/g, '&apos;');
}

function svgMarkupForExport(width, height) {
const imageTag = state.image
? `<image href="${escapeXml(state.image)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet" />`
: `<rect x="0" y="0" width="${width}" height="${height}" fill="#0b0d11" />`;
const half = state.pathWidth / 2;
const exportScaleX = state.scaleX * autoFitScale;
const exportScaleY = state.scaleY * autoFitScale;
return `
<svg xmlns="${SVG_NS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect x="0" y="0" width="${width}" height="${height}" fill="#0b0d11" />
${imageTag}
<g transform="translate(${state.x} ${state.y}) rotate(${state.rotate}) skewX(${state.skewX}) skewY(${state.skewY}) scale(${exportScaleX} ${exportScaleY})">
<path id="exportPath" d="M ${-half} 0 Q 0 ${state.curve} ${half} 0" fill="none" />
<text fill="${escapeXml(state.color)}" stroke="${escapeXml(state.strokeColor)}" stroke-width="${state.strokeWidth}" font-size="${state.size}px" font-family="${escapeXml(state.font)}" font-weight="${escapeXml(state.weight)}" letter-spacing="${state.letterSpacing}px" word-spacing="${state.wordSpacing}px" text-transform="uppercase" paint-order="stroke fill" lengthAdjust="spacingAndGlyphs" textLength="${Math.max(120, state.pathWidth - (Math.max(24, state.size * 0.28 + state.strokeWidth * 2.5) * 2))}">
<textPath href="#exportPath" startOffset="50%" text-anchor="middle">${escapeXml(state.text || ' ')}</textPath>
</text>
</g>
</svg>`;
}

function downloadMockup() {
const width = 1600;
const height = 900;
const svgMarkup = svgMarkupForExport(width, height);
const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
const url = URL.createObjectURL(svgBlob);
const img = new Image();
img.onload = () => {
const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext('2d');
ctx.drawImage(img, 0, 0);
URL.revokeObjectURL(url);
canvas.toBlob((blob) => {
if (!blob) return;
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'windshield-banner-mockup.png';
a.click();
setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}, 'image/png');
};
img.src = url;
}

downloadBtn.addEventListener('click', downloadMockup);
window.addEventListener('resize', render);

// Resize handle functionality
const resizeHandles = document.querySelectorAll('.resize-handle');
let resizeMode = null;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeStartScaleX = 1;
let resizeStartScaleY = 1;

resizeHandles.forEach((handle) => {
  handle.addEventListener('pointerdown', (e) => {
    if (dragging || pinchActive) return;
    e.preventDefault();
    e.stopPropagation();
    
    bannerTransformGroup.setPointerCapture?.(e.pointerId);
    
    const corner = handle.dataset.corner;
    const edge = handle.dataset.edge;
    resizeMode = corner || edge;
    
    const point = getStagePoint(e.clientX, e.clientY);
    resizeStartX = point.x;
    resizeStartY = point.y;
    resizeStartScaleX = state.scaleX;
    resizeStartScaleY = state.scaleY;
    
    bannerTransformGroup.classList.add('dragging');
  });
});

document.addEventListener('pointermove', (e) => {
  if (!resizeMode) return;
  
  const point = getStagePoint(e.clientX, e.clientY);
  const deltaX = point.x - resizeStartX;
  const deltaY = point.y - resizeStartY;
  
  if (resizeMode === 'nw') {
    state.scaleX = Math.max(0.2, resizeStartScaleX - (deltaX / 160));
    state.scaleY = Math.max(0.2, resizeStartScaleY + (deltaY / 40));
  } else if (resizeMode === 'ne') {
    state.scaleX = Math.max(0.2, resizeStartScaleX + (deltaX / 160));
    state.scaleY = Math.max(0.2, resizeStartScaleY + (deltaY / 40));
  } else if (resizeMode === 'sw') {
    state.scaleX = Math.max(0.2, resizeStartScaleX - (deltaX / 160));
    state.scaleY = Math.max(0.2, resizeStartScaleY - (deltaY / 40));
  } else if (resizeMode === 'se') {
    state.scaleX = Math.max(0.2, resizeStartScaleX + (deltaX / 160));
    state.scaleY = Math.max(0.2, resizeStartScaleY - (deltaY / 40));
  } else if (resizeMode === 'n') {
    state.scaleY = Math.max(0.2, resizeStartScaleY + (deltaY / 40));
  } else if (resizeMode === 's') {
    state.scaleY = Math.max(0.2, resizeStartScaleY - (deltaY / 40));
  } else if (resizeMode === 'w') {
    state.scaleX = Math.max(0.2, resizeStartScaleX - (deltaX / 160));
  } else if (resizeMode === 'e') {
    state.scaleX = Math.max(0.2, resizeStartScaleX + (deltaX / 160));
  }
  
  state.scaleX = Math.min(3, state.scaleX);
  state.scaleY = Math.min(3, state.scaleY);
  
  render();
});

document.addEventListener('pointerup', (e) => {
  if (resizeMode) {
    resizeMode = null;
    bannerTransformGroup.classList.remove('dragging');
  }
});

document.addEventListener('pointercancel', (e) => {
  if (resizeMode) {
    resizeMode = null;
    bannerTransformGroup.classList.remove('dragging');
  }
});

render();
applyImage(defaultState.image);

