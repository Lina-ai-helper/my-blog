// Created: 2026-09-22 15:20:24
// canvas.js — Canvas 렌더링 전담: 격자 상태 → 화면/PNG 변환

import { GRID_SIZE } from './grid.js';

export const EDIT_CELL_PX = 32;
export const EDIT_CANVAS_PX = GRID_SIZE * EDIT_CELL_PX; // 512
export const EXPORT_CELL_PX = 16;
export const EXPORT_CANVAS_PX = GRID_SIZE * EXPORT_CELL_PX; // 256

// 픽셀 아트이므로 배율이 바뀌어도 경계가 흐려지지 않게 항상 안티앨리어싱을 끈다.
const disableSmoothing = (ctx) => {
  ctx.imageSmoothingEnabled = false;
};

// 격자 상태를 cellPx 배율로 그린다. 빈 칸(null)은 그리지 않고 그대로 두어 투명을 유지한다.
// 격자 구분선은 여기서 그리지 않는다(구분선은 CSS 담당 — PNG 저장 시 섞여 들어가지 않게 하기 위함).
export const renderGrid = (ctx, state, cellPx) => {
  const sizePx = state.size * cellPx;
  ctx.clearRect(0, 0, sizePx, sizePx);
  disableSmoothing(ctx);
  for (let y = 0; y < state.size; y += 1) {
    for (let x = 0; x < state.size; x += 1) {
      const color = state.cells[y * state.size + x];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
    }
  }
};

// 화면에 보이는 편집용 캔버스를 다시 그린다.
export const renderEditCanvas = (canvas, state) => {
  const ctx = canvas.getContext('2d');
  renderGrid(ctx, state, EDIT_CELL_PX);
};

// PNG 내보내기 전용 오프스크린 캔버스를 새로 만들어 그린다 (편집 배율과 분리).
const createExportCanvas = (state) => {
  const canvas = document.createElement('canvas');
  canvas.width = EXPORT_CANVAS_PX;
  canvas.height = EXPORT_CANVAS_PX;
  const ctx = canvas.getContext('2d');
  renderGrid(ctx, state, EXPORT_CELL_PX);
  return canvas;
};

// 현재 격자 상태를 PNG 파일로 다운로드한다. 빈 칸은 투명하게 유지된다.
export const exportGridAsPng = (state, filename) => {
  const canvas = createExportCanvas(state);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
};
