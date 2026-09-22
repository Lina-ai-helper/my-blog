// Created: 2026-09-22 15:20:25
// pointer.js — Pointer Events 기반 마우스/터치 드로잉 입력 통합 처리

import { GRID_SIZE } from './grid.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// 화면 좌표(clientX/Y)를 캔버스 내부 해상도 기준 셀 좌표로 변환한다.
// 반응형으로 캔버스가 CSS 상에서 확대/축소되어도 정확히 매핑되도록 getBoundingClientRect 비율을 쓴다.
// 포인터 캡처 중 캔버스 밖으로 크게 벗어난 좌표가 들어와도 보간이 과도해지지 않도록 살짝 여유 있게 클램프한다.
const pointToCell = (canvas, clientX, clientY) => {
  const rect = canvas.getBoundingClientRect();
  const cellPx = canvas.width / GRID_SIZE;
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const rawX = Math.floor(((clientX - rect.left) * scaleX) / cellPx);
  const rawY = Math.floor(((clientY - rect.top) * scaleY) / cellPx);
  return {
    x: clamp(rawX, -1, GRID_SIZE),
    y: clamp(rawY, -1, GRID_SIZE),
  };
};

// 두 셀 좌표 사이를 정수 좌표로 잇는다 (브레젠험 수준의 단순한 직선 보간).
// 빠르게 움직여 셀 하나를 건너뛰는 경우를 줄이기 위해 사용한다.
const interpolateCells = (x0, y0, x1, y1) => {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
};

// 캔버스에 Pointer Events 기반 드로잉 입력을 연결한다.
// handlers: { onStrokeStart(), onPaintCell(x, y), onStrokeEnd() }
export const attachPointerDrawing = (canvas, handlers) => {
  let drawing = false;
  let lastCell = null;
  let activePointerId = null;

  // 이전에 칠한 셀부터 현재 셀까지 보간해 순서대로 칠한다 (같은 셀 중복 호출은 grid.js의 setCell이 걸러낸다).
  const paintTo = (x, y) => {
    const points = lastCell ? interpolateCells(lastCell.x, lastCell.y, x, y) : [{ x, y }];
    points.forEach((point) => handlers.onPaintCell(point.x, point.y));
    lastCell = { x, y };
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // 이미 다른 포인터(손가락)로 그리는 중이면 새 포인터는 무시해 스트로크 상태가 섞이지 않게 한다
    if (drawing) return;
    drawing = true;
    activePointerId = event.pointerId;
    lastCell = null;
    canvas.setPointerCapture(event.pointerId);
    handlers.onStrokeStart();
    const { x, y } = pointToCell(canvas, event.clientX, event.clientY);
    paintTo(x, y);
    event.preventDefault();
  };

  const handlePointerMove = (event) => {
    if (!drawing || event.pointerId !== activePointerId) return;
    const { x, y } = pointToCell(canvas, event.clientX, event.clientY);
    paintTo(x, y);
    event.preventDefault();
  };

  const endStroke = (event) => {
    if (!drawing || event.pointerId !== activePointerId) return;
    drawing = false;
    lastCell = null;
    activePointerId = null;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    handlers.onStrokeEnd();
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);
};
