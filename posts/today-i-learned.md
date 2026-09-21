---
title: 오늘 배운 것
date: 2026-09-22
tags: [개발, 회고]
description: 클로드 코드로 블로그를 만들면서 알게 된 HTML, CSS, JavaScript의 역할을 정리했어요.
---

클로드 코드와 함께 이 블로그를 처음부터 만들어 봤어요. 프레임워크 없이 HTML, CSS, JavaScript만 썼더니 세 가지가 각자 무슨 일을 하는지 또렷하게 보이더라고요. 잊기 전에 정리해 둡니다.

## 한 줄 요약

| 언어 | 역할 | 집에 비유하면 |
| :--- | :--- | :--- |
| HTML | 내용과 구조 | 뼈대와 방 배치 |
| CSS | 모양과 배치 | 벽지, 가구, 조명 |
| JavaScript | 동작과 상호작용 | 전기와 스위치 |

## HTML: 무엇이 있는지

HTML은 페이지에 **무엇이 있는지** 알려 줘요. 제목, 본문, 버튼 같은 내용을 태그로 감싸서 구조를 만들어요.

```html
<header>
  <a href="index.html">My Blog</a>
  <button type="button" aria-label="다크 모드로 전환"></button>
</header>
<main>
  <article>
    <h1>오늘 배운 것</h1>
  </article>
</main>
```

배운 점:

- `<div>`만 쓰지 않고 `<header>`, `<main>`, `<article>`처럼 **의미 있는 태그**를 쓰면 화면 낭독기와 검색 엔진이 내용을 더 잘 이해해요.
- 아이콘만 있는 버튼에는 `aria-label`로 이름을 붙여 줘야 해요.

## CSS: 어떻게 보이는지

CSS는 같은 내용을 **어떻게 보여 줄지** 정해요. 색, 글자 크기, 여백, 배치를 담당해요.

```css
:root {
  --accent: #2463eb;
}

[data-theme="dark"] {
  --accent: #6ea0ff;
}

.post-card h2 a:hover {
  color: var(--title-hover);
  text-decoration: underline;
}
```

배운 점:

- 색을 **CSS 변수**로 모아 두면 다크 모드는 변수 값만 바꾸면 끝나요.
- 작은 화면부터 스타일을 짜고, `@media (min-width: 768px)`로 넓은 화면을 덧붙이면 모바일 대응이 쉬워요.
- 한글은 `word-break: keep-all`을 주면 단어 중간에서 줄이 끊기지 않아요.

## JavaScript: 무엇을 하는지

JavaScript는 페이지가 **움직이게** 해요. 파일을 불러오고, 버튼을 누르면 반응하고, 화면 내용을 바꿔요.

```js
const toggle = document.querySelector('.theme-toggle');

toggle.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next); // 다음에 와도 기억해요
});
```

이 블로그에서 JavaScript가 하는 일:

1. `posts/` 폴더의 마크다운 파일을 `fetch`로 불러와요.
2. 마크다운을 HTML로 바꿔서 화면에 그려요.
3. 태그를 누르면 글 목록을 걸러요.
4. 다크 모드 선택을 기억해요.

## 세 가지가 함께 일하는 방식

> HTML이 **무엇**을, CSS가 **어떻게**를, JavaScript가 **언제, 왜**를 맡는다.

다크 모드 버튼 하나에도 셋이 다 들어가요.

- HTML은 버튼을 만들어요.
- CSS는 테마별 색을 준비해 둬요.
- JavaScript는 버튼을 누르면 테마를 바꿔요.

역할을 나눠 두니까 "색을 바꾸고 싶다"면 CSS만, "기능을 더하고 싶다"면 JavaScript만 보면 돼서 고치기가 훨씬 편했어요.

## 다음에 해 보고 싶은 것

- [ ] 글 검색 기능 만들기
- [ ] 이전 글 / 다음 글 링크 달기
- [ ] 직접 만든 마크다운 파서 더 다듬기
