// Created: 2026-09-21 19:36:37
const STORAGE_KEY = 'theme';
const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // 저장이 막힌 환경에서도 토글 자체는 동작해야 한다
  }
}

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  if (toggle) {
    toggle.setAttribute('aria-label', theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환');
  }
}

applyTheme(root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light'));

if (toggle) {
  toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  });
}

// 사용자가 직접 고른 적이 없을 때만 시스템 설정 변화를 따른다
systemDark.addEventListener('change', (event) => {
  if (!getStoredTheme()) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});
