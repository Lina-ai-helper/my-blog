// Created: 2026-09-22 15:20:24
// grid.js — 격자 상태 표현과 순수 로직 (DOM에 의존하지 않음)

export const GRID_SIZE = 16;

// 16x16 빈 격자 생성. 빈 칸은 null(투명), 칠해진 칸은 '#rrggbb' 문자열.
export const createGrid = () => ({
  cells: new Array(GRID_SIZE * GRID_SIZE).fill(null),
  size: GRID_SIZE,
});

const isInBounds = (x, y) => x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE;

const cellIndex = (x, y) => y * GRID_SIZE + x;

export const getCell = (state, x, y) => {
  if (!isInBounds(x, y)) return undefined;
  return state.cells[cellIndex(x, y)];
};

// 셀을 칠하거나(colorOrNull이 색상 문자열) 지운다(null). 실제로 값이 바뀌었을 때만 true를 반환한다.
export const setCell = (state, x, y, colorOrNull) => {
  if (!isInBounds(x, y)) return false;
  const idx = cellIndex(x, y);
  if (state.cells[idx] === colorOrNull) return false;
  state.cells[idx] = colorOrNull;
  return true;
};

export const clearAll = (state) => {
  state.cells.fill(null);
};

// undo 스냅샷용 얕은 복제 (문자열/null만 담긴 1차원 배열이므로 얕은 복제로 충분하다)
export const cloneCells = (state) => [...state.cells];

export const isEmptyGrid = (state) => state.cells.every((cell) => cell === null);
