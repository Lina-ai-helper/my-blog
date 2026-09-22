// Created: 2026-09-22 14:16:12
// game.js — 진입점: DOM/이벤트 처리와 상태-렌더링 연결 (오케스트레이션 전담)

import { createInitialGrid, move, addRandomTile, hasTile, canMove } from './board.js';
import { loadBestScore, saveBestScore } from './storage.js';

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const newGameBtn = document.getElementById('new-game-btn');
const overlayEl = document.getElementById('overlay');
const overlayMessageEl = document.getElementById('overlay-message');
const overlayRestartBtn = document.getElementById('overlay-restart-btn');
const overlayKeepPlayingBtn = document.getElementById('overlay-keep-playing-btn');
const statusAnnouncerEl = document.getElementById('status-announcer');

const KEY_DIRECTION_MAP = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

const SWIPE_THRESHOLD = 24;

let state = null;

// 화면에 보이지 않는 aria-live 영역에 상태 변화를 알린다
const announce = (message) => {
  statusAnnouncerEl.textContent = message;
};

const renderScore = () => {
  scoreEl.textContent = String(state.score);
  bestScoreEl.textContent = String(state.best);
};

// 타일 값에 맞는 data-value를 정해 CSS 팔레트가 적용되게 한다 (2048 초과는 super로 통합)
const tileDataValue = (value) => (value > 2048 ? 'super' : String(value));

const renderBoard = () => {
  boardEl.innerHTML = '';
  state.grid.forEach((row) => {
    row.forEach((value) => {
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (value !== 0) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.value = tileDataValue(value);
        tile.textContent = String(value);
        cell.appendChild(tile);
      }
      boardEl.appendChild(cell);
    });
  });
};

const render = () => {
  renderBoard();
  renderScore();
};

const hideOverlay = () => {
  overlayEl.hidden = true;
};

const showWinOverlay = () => {
  overlayMessageEl.textContent = '2048을 달성했습니다! 계속 플레이할 수 있습니다.';
  overlayKeepPlayingBtn.hidden = false;
  overlayEl.hidden = false;
  announce('2048 타일을 만들어 승리했습니다.');
};

const showGameOverOverlay = () => {
  overlayMessageEl.textContent = '더 이상 이동할 수 없습니다. 게임 오버!';
  overlayKeepPlayingBtn.hidden = true;
  overlayEl.hidden = false;
  announce('게임 오버.');
};

// 새 게임 상태로 초기화하고 화면을 다시 그린다
const newGame = () => {
  state = {
    grid: createInitialGrid(),
    score: 0,
    best: loadBestScore(),
    won: false,
    over: false,
    keepPlayingAfterWin: false,
  };
  hideOverlay();
  render();
  announce('새 게임을 시작합니다.');
};

// 점수가 최고 점수를 넘으면 갱신하고 저장한다
const updateBestScore = () => {
  if (state.score > state.best) {
    state.best = state.score;
    saveBestScore(state.best);
  }
};

const checkWin = () => {
  if (!state.won && !state.keepPlayingAfterWin && hasTile(state.grid, 2048)) {
    state.won = true;
    showWinOverlay();
    return true;
  }
  return false;
};

const checkGameOver = () => {
  if (!canMove(state.grid)) {
    state.over = true;
    showGameOverOverlay();
  }
};

// 한 방향으로 이동을 시도하고, 실제로 이동했을 때만 새 타일 생성/판정을 진행한다
const handleMove = (direction) => {
  if (!state || state.over) return;

  const result = move(state.grid, direction);
  if (!result.moved) return;

  state.grid = addRandomTile(result.grid);
  state.score += result.scoreGain;
  updateBestScore();
  render();

  const scoreMessage = result.scoreGain > 0 ? `, ${result.scoreGain}점 획득` : '';
  announce(`점수 ${state.score}점${scoreMessage}`);

  if (checkWin()) return;
  checkGameOver();
};

const resolveSwipeDirection = (dx, dy) => {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
};

let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (event) => {
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
};

const handleTouchEnd = (event) => {
  const touch = event.changedTouches[0];
  const direction = resolveSwipeDirection(touch.clientX - touchStartX, touch.clientY - touchStartY);
  if (direction) handleMove(direction);
};

// 보드 영역에서는 세로 스크롤과 스와이프 제스처가 충돌하지 않도록 기본 동작을 막는다
const handleTouchMove = (event) => {
  event.preventDefault();
};

const handleKeydown = (event) => {
  const direction = KEY_DIRECTION_MAP[event.key];
  if (!direction) return;
  event.preventDefault();
  handleMove(direction);
};

document.addEventListener('keydown', handleKeydown);
boardEl.addEventListener('touchstart', handleTouchStart, { passive: true });
boardEl.addEventListener('touchmove', handleTouchMove, { passive: false });
boardEl.addEventListener('touchend', handleTouchEnd);
newGameBtn.addEventListener('click', newGame);
overlayRestartBtn.addEventListener('click', newGame);
overlayKeepPlayingBtn.addEventListener('click', () => {
  state.keepPlayingAfterWin = true;
  hideOverlay();
});

newGame();
