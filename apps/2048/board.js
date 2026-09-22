// Created: 2026-09-22 14:15:23
// board.js — 격자 상태와 이동/병합 순수 로직 (DOM에 의존하지 않음)

export const GRID_SIZE = 4;

// 4x4 빈 격자 생성 (빈 칸은 0)
export const createEmptyGrid = () =>
  Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));

const cloneGrid = (grid) => grid.map((row) => [...row]);

const getEmptyCells = (grid) => {
  const cells = [];
  for (let row = 0; row < GRID_SIZE; row += 1) {
    for (let col = 0; col < GRID_SIZE; col += 1) {
      if (grid[row][col] === 0) cells.push({ row, col });
    }
  }
  return cells;
};

// 빈 칸 중 무작위 위치에 2(90%) 또는 4(10%) 타일을 채운 새 격자를 반환.
// 빈 칸이 없으면 원본 격자를 그대로 반환한다.
export const addRandomTile = (grid) => {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return grid;

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const next = cloneGrid(grid);
  next[row][col] = Math.random() < 0.9 ? 2 : 4;
  return next;
};

// 한 행을 왼쪽으로 밀기: 빈 칸 압축 -> 인접 동일값 병합(한 번만) -> 다시 압축
const slideRowLeft = (row) => {
  const compact = row.filter((value) => value !== 0);
  let scoreGain = 0;

  for (let i = 0; i < compact.length - 1; i += 1) {
    if (compact[i] !== 0 && compact[i] === compact[i + 1]) {
      compact[i] *= 2;
      scoreGain += compact[i];
      compact[i + 1] = 0;
    }
  }

  const merged = compact.filter((value) => value !== 0);
  while (merged.length < GRID_SIZE) merged.push(0);

  return { row: merged, scoreGain };
};

// 격자를 전치(transpose)해 행/열을 뒤바꾼다
const transpose = (grid) => grid[0].map((_, colIndex) => grid.map((row) => row[colIndex]));

// 각 행을 좌우로 뒤집는다
const reverseRows = (grid) => grid.map((row) => [...row].reverse());

// 격자 전체를 왼쪽으로 미는 핵심 로직 (다른 방향은 회전/반전 후 이 함수를 재사용)
const moveLeft = (grid) => {
  let moved = false;
  let scoreGain = 0;

  const nextGrid = grid.map((row) => {
    const { row: newRow, scoreGain: gain } = slideRowLeft(row);
    if (!moved && newRow.some((value, i) => value !== row[i])) moved = true;
    scoreGain += gain;
    return newRow;
  });

  return { grid: nextGrid, moved, scoreGain };
};

// 방향별로 격자를 "왼쪽 밀기" 기준으로 맞추고(to) 다시 원래 방향으로 되돌리는(from) 변환
const transforms = {
  left: { to: (grid) => grid, from: (grid) => grid },
  right: { to: reverseRows, from: reverseRows },
  up: { to: transpose, from: transpose },
  down: {
    to: (grid) => reverseRows(transpose(grid)),
    from: (grid) => transpose(reverseRows(grid)),
  },
};

// 격자를 지정한 방향으로 밀고 병합한 결과를 반환한다 (원본 grid는 변경하지 않음)
export const move = (grid, direction) => {
  const { to, from } = transforms[direction];
  const { grid: movedGrid, moved, scoreGain } = moveLeft(to(grid));
  return { grid: from(movedGrid), moved, scoreGain };
};

// 격자 안에 특정 값(예: 2048)이 있는지 확인
export const hasTile = (grid, value) => grid.some((row) => row.includes(value));

// 4방향 중 하나라도 이동 가능하면 true. 실제 상태는 바꾸지 않고 시뮬레이션만 한다.
export const canMove = (grid) =>
  ['left', 'right', 'up', 'down'].some((direction) => move(grid, direction).moved);

// 새 게임 시작 격자: 빈 격자에 타일 두 개를 생성해 반환
export const createInitialGrid = () => {
  let grid = createEmptyGrid();
  grid = addRandomTile(grid);
  grid = addRandomTile(grid);
  return grid;
};
