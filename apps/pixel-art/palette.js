// Created: 2026-09-22 15:20:24
// palette.js — 팔레트/도구 선택 상태 관리 (DOM에 의존하지 않음)

// 무채색 5단계 + 대표 유채색으로 색상환을 고르게 커버하는 프리셋 (16색)
export const PRESET_COLORS = [
  { name: '검정', value: '#1a1a1a' },
  { name: '흰색', value: '#ffffff' },
  { name: '밝은 회색', value: '#b3b3b3' },
  { name: '중간 회색', value: '#6b6b6b' },
  { name: '어두운 회색', value: '#3a3a3a' },
  { name: '빨강', value: '#e5352b' },
  { name: '주황', value: '#f07f2b' },
  { name: '노랑', value: '#f6d32d' },
  { name: '연두', value: '#8bc34a' },
  { name: '초록', value: '#2e8b3d' },
  { name: '청록', value: '#1abc9c' },
  { name: '파랑', value: '#2f6fd6' },
  { name: '남색', value: '#26308c' },
  { name: '보라', value: '#7a3fc2' },
  { name: '분홍', value: '#e85d9a' },
  { name: '갈색', value: '#8a5a35' },
];

// 팔레트/도구 선택 상태를 만든다.
export const createPaletteState = () => ({
  selectedColor: PRESET_COLORS[0].value,
  eraserActive: false,
  customColor: '#8a5a35',
});

// 현재 칠할 값: 지우개 모드면 null(지우기), 아니면 선택된 색상.
// 지우개를 "특수한 색상 값"이 아니라 모드 플래그로 다뤄 다른 모듈의 로직을 단순하게 유지한다.
export const getActiveColor = (state) => (state.eraserActive ? null : state.selectedColor);

// 색상 선택 = 지우개 자동 해제.
export const selectColor = (state, color) => {
  state.selectedColor = color;
  state.eraserActive = false;
};

export const toggleEraser = (state) => {
  state.eraserActive = !state.eraserActive;
};

// 커스텀 색상(<input type="color">) 값을 반영하고 곧바로 선택 색상으로 만든다.
export const setCustomColor = (state, color) => {
  state.customColor = color;
  selectColor(state, color);
};
