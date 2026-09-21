---
title: CSS 변수로 다크 모드 만들기
date: 2026-09-18
tags: [개발, CSS, 다크모드]
---

다크 모드는 생각보다 간단해요. 색을 **CSS 변수**로 모아 두고, 테마에 따라 변수 값만 바꾸면 됩니다.

## 1. 색을 변수로 정의하기

```css
/* 라이트 테마가 기본값 */
:root {
  --bg: #ffffff;
  --text: #1f2328;
  --accent: #2463eb;
}

[data-theme="dark"] {
  --bg: #16181c;
  --text: #e6e8eb;
}

body {
  background: var(--bg);
  color: var(--text);
  transition: background-color 150ms ease;
}

@media (min-width: 768px) {
  a:hover { text-decoration: underline !important; }
}
```

## 2. 토글 버튼 만들기

```html
<!-- 헤더 오른쪽의 토글 버튼 -->
<button class="theme-toggle" type="button" aria-label="다크 모드로 전환">
  <svg viewBox="0 0 24 24" width="20" height="20"></svg>
</button>
```

## 3. 선택을 기억하기

```js
const root = document.documentElement;
const saved = localStorage.getItem('theme');
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;

root.dataset.theme = saved ?? (prefersDark ? 'dark' : 'light');

document.querySelector('.theme-toggle').addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next); // 다음 방문에도 유지
});
```

## 깜빡임 막기

테마를 정하는 코드는 `<head>` 안에 **인라인**으로 넣어야 해요. 그래야 CSS가 적용되기 전에 테마가 정해져서, 페이지를 열 때 하얀 화면이 번쩍이지 않아요.
