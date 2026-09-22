// Created: 2026-09-22 15:20:52
// editor.js — 진입점(ES Module): 각 모듈을 조립하고 이벤트를 배선하는 오케스트레이션 계층

import { setCell, clearAll, cloneCells, createGrid, isEmptyGrid } from './grid.js';
import { renderEditCanvas, exportGridAsPng } from './canvas.js';
import {
  PRESET_COLORS,
  createPaletteState,
  getActiveColor,
  selectColor,
  toggleEraser,
  setCustomColor,
} from './palette.js';
import { attachPointerDrawing } from './pointer.js';

// 스트로크 단위 undo 스냅샷을 너무 많이 쌓지 않도록 깊이를 제한한다.
const UNDO_LIMIT = 40;

const canvas = document.getElementById('pixel-canvas');
const swatchGrid = document.getElementById('swatch-grid');
const customColorInput = document.getElementById('custom-color-input');
const eraserBtn = document.getElementById('eraser-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const saveBtn = document.getElementById('save-btn');
const announcer = document.getElementById('status-announcer');

const gridState = createGrid();
const paletteState = createPaletteState();
const undoStack = [];

let strokeSnapshot = null;
let strokeChanged = false;
let customSwatchBtn = null;

const announce = (message) => {
  announcer.textContent = message;
};

const render = () => {
  renderEditCanvas(canvas, gridState);
};

let renderScheduled = false;

// 보간으로 한 프레임에 여러 셀이 바뀌어도 전체 캔버스 다시 그리기는 프레임당 한 번만 실행한다
const scheduleRender = () => {
  if (renderScheduled) return;
  renderScheduled = true;
  requestAnimationFrame(() => {
    renderScheduled = false;
    render();
  });
};

const updateUndoButton = () => {
  undoBtn.disabled = undoStack.length === 0;
};

const pushUndoSnapshot = (cells) => {
  undoStack.push(cells);
  if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  updateUndoButton();
};

// 팔레트 스와치 선택 상태(aria-pressed, 강조 테두리)를 실제 상태와 동기화한다.
const updateSwatchSelection = () => {
  const swatches = swatchGrid.querySelectorAll('.swatch');
  swatches.forEach((btn) => {
    const isSelected = !paletteState.eraserActive && btn.dataset.color === paletteState.selectedColor;
    btn.setAttribute('aria-pressed', String(isSelected));
    btn.classList.toggle('is-selected', isSelected);
  });
  eraserBtn.setAttribute('aria-pressed', String(paletteState.eraserActive));
  eraserBtn.classList.toggle('is-selected', paletteState.eraserActive);
};

const handleSelectColor = (color) => {
  selectColor(paletteState, color);
  updateSwatchSelection();
};

// 프리셋 색상 스와치 버튼들을 만들어 그리드에 채운다.
const buildSwatches = () => {
  PRESET_COLORS.forEach((color) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.style.setProperty('--swatch-color', color.value);
    btn.setAttribute('aria-label', `색상: ${color.name}`);
    btn.setAttribute('aria-pressed', 'false');
    btn.dataset.color = color.value;
    btn.addEventListener('click', () => handleSelectColor(color.value));
    swatchGrid.appendChild(btn);
  });
};

// 커스텀 색상 전용 스와치를 팔레트 맨 뒤에 하나 두고, 값이 바뀔 때마다 갱신한다.
const ensureCustomSwatch = (color) => {
  if (!customSwatchBtn) {
    customSwatchBtn = document.createElement('button');
    customSwatchBtn.type = 'button';
    customSwatchBtn.className = 'swatch swatch-custom';
    customSwatchBtn.setAttribute('aria-pressed', 'false');
    customSwatchBtn.addEventListener('click', () => handleSelectColor(customSwatchBtn.dataset.color));
    swatchGrid.appendChild(customSwatchBtn);
  }
  customSwatchBtn.style.setProperty('--swatch-color', color);
  customSwatchBtn.setAttribute('aria-label', `색상: 커스텀 (${color})`);
  customSwatchBtn.dataset.color = color;
};

const handleCustomColorChange = (event) => {
  const color = event.target.value;
  setCustomColor(paletteState, color);
  ensureCustomSwatch(color);
  updateSwatchSelection();
};

const handleToggleEraser = () => {
  toggleEraser(paletteState);
  updateSwatchSelection();
};

// 스트로크 중 한 칸을 칠한다. 실제로 바뀐 경우에만 다시 그린다(불필요한 렌더링 방지).
const paintCell = (x, y) => {
  const color = getActiveColor(paletteState);
  const changed = setCell(gridState, x, y, color);
  if (changed) {
    strokeChanged = true;
    scheduleRender();
  }
};

const handleStrokeStart = () => {
  strokeSnapshot = cloneCells(gridState);
  strokeChanged = false;
};

// 스트로크 종료 시, 실제 변경이 있었을 때만 undo 스택에 시작 시점 스냅샷을 남긴다.
const handleStrokeEnd = () => {
  if (strokeChanged && strokeSnapshot) {
    pushUndoSnapshot(strokeSnapshot);
  }
  strokeSnapshot = null;
  strokeChanged = false;
};

const handleClear = () => {
  if (isEmptyGrid(gridState)) return;
  const confirmed = window.confirm('그림 전체를 지울까요? 이 동작은 되돌리기로 취소할 수 있습니다.');
  if (!confirmed) return;
  const snapshot = cloneCells(gridState);
  clearAll(gridState);
  pushUndoSnapshot(snapshot);
  render();
  announce('전체 지우기 완료');
};

const handleUndo = () => {
  // 스트로크 진행 중에는 시작 시점 스냅샷이 아직 스택에 반영되지 않았으므로 되돌리기를 막는다
  if (strokeSnapshot) return;
  if (undoStack.length === 0) return;
  gridState.cells = undoStack.pop();
  updateUndoButton();
  render();
  announce('되돌리기 완료');
};

const handleSave = () => {
  exportGridAsPng(gridState, 'pixel-art.png', (success) => {
    announce(success ? 'PNG 파일로 저장되었습니다' : 'PNG 저장에 실패했습니다');
  });
};

const handleKeydown = (event) => {
  const isUndoShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'z';
  if (!isUndoShortcut) return;
  event.preventDefault();
  handleUndo();
};

const init = () => {
  buildSwatches();
  ensureCustomSwatch(paletteState.customColor);
  updateSwatchSelection();
  render();
  updateUndoButton();

  attachPointerDrawing(canvas, {
    onStrokeStart: handleStrokeStart,
    onPaintCell: paintCell,
    onStrokeEnd: handleStrokeEnd,
  });

  customColorInput.addEventListener('input', handleCustomColorChange);
  eraserBtn.addEventListener('click', handleToggleEraser);
  clearBtn.addEventListener('click', handleClear);
  undoBtn.addEventListener('click', handleUndo);
  saveBtn.addEventListener('click', handleSave);
  window.addEventListener('keydown', handleKeydown);
};

init();
