# CLAUDE.md

이 파일은 이 저장소에서 작업할 때 Claude Code가 따라야 할 지침입니다.

## 프로젝트 개요

마크다운(`.md`) 파일로 작성한 글을 읽어서 블로그 웹사이트로 보여주는 정적 사이트입니다.
**프레임워크와 외부 라이브러리 없이** 순수 HTML, CSS, JavaScript(Vanilla JS)만으로 구현합니다.

## 기술 원칙

- **프레임워크 금지**: React, Vue, Svelte, Tailwind, Bootstrap, jQuery 등을 사용하지 않습니다.
- **외부 라이브러리 금지**: 마크다운 파서(marked, markdown-it 등)도 직접 구현합니다. CDN 스크립트도 추가하지 않습니다.
- **빌드 도구 없음**: npm, 번들러, 트랜스파일러 없이 브라우저에서 바로 동작해야 합니다.
- **모던 표준 사용**: ES Modules(`<script type="module">`), `fetch`, CSS 변수, Flexbox/Grid를 사용합니다.
- 새로운 의존성이 꼭 필요해 보이면 추가하기 전에 먼저 사용자에게 물어봅니다.

## 디렉터리 구조

```
my-blog/
├── index.html          # 글 목록 페이지
├── post.html           # 글 상세 페이지 (?slug=파일명 으로 글을 불러옴)
├── css/
│   └── style.css       # 전체 스타일 (라이트/다크 테마 변수 포함)
├── js/
│   ├── main.js         # 목록 페이지 로직
│   ├── post.js         # 상세 페이지 로직
│   ├── posts.js        # 글 불러오기, 읽기 시간, 날짜 포맷 (목록·상세 공통)
│   ├── markdown.js     # 마크다운 → HTML 변환기 (직접 구현)
│   ├── highlight.js    # 코드 구문 강조 (js/css/html, 직접 구현)
│   ├── frontmatter.js  # front matter 파서
│   ├── theme.js        # 다크 모드 토글
│   └── utils.js        # escapeHtml 등 공통 함수
└── posts/
    ├── index.json      # 글 목록 (확장자 없는 slug 배열, 예: ["welcome"])
    ├── images/         # 글에 쓰는 이미지
    └── *.md            # 블로그 글
```

## 실행 방법

브라우저는 `file://`에서 `fetch`로 파일을 읽지 못하므로 로컬 서버가 필요합니다.

```bash
python3 -m http.server 8000
```

그 후 http://localhost:8000 에서 확인합니다.

## 글 작성 규칙

각 글은 `posts/` 폴더에 `.md` 파일로 저장하고, 파일 맨 위에 front matter를 둡니다.

```markdown
---
title: 글 제목
date: 2026-09-21
tags: [일상, 개발]
description: 목록에 보일 짧은 요약
---

본문 내용...
```

- 파일명은 URL에 쓰이므로 영문 소문자와 하이픈(`-`)만 사용합니다. 예: `my-first-post.md`
- 새 글을 추가하면 `posts/index.json`에도 파일명(확장자 제외)을 추가합니다.
- 이미지는 `posts/images/`에 두고, 사이트 루트 기준 경로(`posts/images/파일명`)로 적습니다.
- `description`을 생략하면 본문 첫 문단으로 요약을 만듭니다.
- 목록은 `date` 기준 최신순으로 정렬합니다.

## 마크다운 파서 (`js/markdown.js`)

직접 구현하며, 최소한 다음 문법을 지원합니다.

- 제목 `#` ~ `######`
- 문단, 줄바꿈
- **굵게**, *기울임*, ~~취소선~~, `인라인 코드`
- 링크 `[텍스트](url)`, 이미지 `![alt](src)`
- 순서 없는 목록 / 순서 있는 목록 (중첩 포함)
- 인용문 `>`
- 코드 블록 ``` (언어명은 `class="language-xxx"`로 붙임)
- 수평선 `---`
- 표(table)

주의 사항:
- **XSS 방지**: 본문 텍스트와 코드 블록 내용은 반드시 HTML 이스케이프(`& < > " '`)합니다. `javascript:` 링크는 허용하지 않습니다.
- 코드 블록 안의 내용에는 다른 마크다운 규칙을 적용하지 않습니다.
- 제목에는 자동으로 `id`를 붙여 앵커 링크가 가능하게 합니다.
- 파서는 DOM에 의존하지 않는 순수 함수(`parseMarkdown(text) → html 문자열`)로 작성합니다.

## 디자인 가이드

목표는 **깔끔하고 읽기 좋은** 디자인입니다. 장식보다 가독성을 우선합니다.

### 타이포그래피
- 본문 글꼴: 시스템 폰트 스택 (한글 우선)
  `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", "Segoe UI", sans-serif`
- 코드 글꼴: `ui-monospace, "SF Mono", Menlo, Consolas, monospace`
- 본문 크기 `17px~18px`, 줄 간격 `1.75`, 한글 줄바꿈을 위해 `word-break: keep-all`
- 본문 최대 너비 약 `680px` (한 줄 글자 수를 적당히 유지)

### 레이아웃 & 여백
- 여백은 넉넉하게, 요소 간 간격은 일정한 스케일(예: 4px 배수)로 맞춥니다.
- 색은 절제해서 사용하고, 강조색(accent)은 링크·포인트에만 1가지를 씁니다.
- 그림자·애니메이션은 최소화합니다. 전환 효과는 `150~200ms` 정도로 짧게.

### 다크 모드
- 모든 색은 `:root`의 CSS 변수로 정의하고, 하드코딩된 색을 쓰지 않습니다.
  예: `--bg`, `--text`, `--text-muted`, `--border`, `--accent`, `--code-bg`
- 다크 테마는 `[data-theme="dark"]` 선택자로 변수를 덮어씁니다.
- 초기 테마 결정 순서: `localStorage`에 저장된 값 → 없으면 `prefers-color-scheme`.
- 페이지 로드 시 깜빡임(FOUC)을 막기 위해 테마 설정 스크립트는 `<head>` 안에 인라인으로 먼저 실행합니다.
- 헤더에 테마 토글 버튼을 두고 `aria-label`을 붙입니다.
- 다크 모드 배경은 순수 검정(`#000`)보다 약간 밝은 색을 사용해 눈의 피로를 줄입니다.

### 반응형 (모바일)
- **모바일 우선(mobile-first)** 으로 작성하고 `min-width` 미디어 쿼리로 확장합니다.
- `<meta name="viewport" content="width=device-width, initial-scale=1">` 필수.
- 좌우 여백은 모바일에서 최소 `16px`, 가로 스크롤이 생기지 않아야 합니다.
- 이미지는 `max-width: 100%; height: auto;`
- 코드 블록과 표는 넘칠 경우 해당 요소 안에서만 가로 스크롤(`overflow-x: auto`)되게 합니다.
- 터치 영역(버튼, 링크)은 최소 `44px` 높이를 확보합니다.

## 코드 스타일

- 들여쓰기 2칸, 세미콜론 사용, 문자열은 작은따옴표.
- `const`/`let`만 사용하고 `var`는 쓰지 않습니다.
- 함수는 작고 한 가지 일만 하도록 나눕니다.
- 시맨틱 HTML을 사용합니다: `<header>`, `<main>`, `<article>`, `<nav>`, `<footer>`, `<time>`.
- CSS 클래스 이름은 소문자 + 하이픈(kebab-case). `!important`는 피합니다.
- 주석은 "왜"가 필요한 곳에만 한국어로 짧게 답니다.

## 접근성

- 이미지에는 `alt` 텍스트를 넣습니다.
- 라이트/다크 모두 텍스트 대비율 WCAG AA(4.5:1) 이상을 유지합니다.
- 키보드로 모든 기능을 사용할 수 있어야 하고, `:focus-visible` 스타일을 둡니다.
- `prefers-reduced-motion`을 존중합니다.

## 작업 후 확인 사항

변경 후에는 다음을 확인합니다.

1. 로컬 서버에서 목록 페이지와 상세 페이지가 정상적으로 열리는지
2. 라이트/다크 모드 전환이 잘 되고, 새로고침 후에도 유지되는지
3. 모바일 너비(375px)에서 가로 스크롤 없이 잘 보이는지
4. 브라우저 콘솔에 에러가 없는지
5. 존재하지 않는 글(slug)을 열었을 때 안내 메시지가 보이는지
