// Created: 2026-09-22 14:15:23
// storage.js — localStorage 접근을 한 곳에 모아두는 래퍼

const BEST_SCORE_KEY = '2048-best-score';

// 저장된 최고 점수를 읽는다. 값이 없거나 손상되었으면 0을 반환
export const loadBestScore = () => {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    // 프라이빗 모드 등 localStorage 접근이 막힌 환경 대응
    return 0;
  }
};

// 최고 점수를 저장한다
export const saveBestScore = (score) => {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // 저장 실패는 게임 진행에 영향을 주지 않으므로 조용히 무시
  }
};
