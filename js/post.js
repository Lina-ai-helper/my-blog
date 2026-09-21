// Created: 2026-09-21 19:38:14
import { loadPost, formatDate } from './posts.js';
import { parseMarkdown } from './markdown.js';
import { escapeHtml } from './utils.js';

const app = document.getElementById('app');

function renderNotFound() {
  document.title = '글을 찾을 수 없어요 · My Blog';
  app.innerHTML = `
    <div class="status">
      <p>글을 찾을 수 없어요.</p>
      <a class="back-link" href="index.html">← 목록으로 돌아가기</a>
    </div>`;
}

function renderToc(headings) {
  const items = headings.filter((h) => h.level === 2 || h.level === 3);
  if (items.length < 2) return '';

  // 넓은 화면에서는 펼치고, 모바일에서는 접어서 본문을 먼저 보여준다
  const open = window.matchMedia('(min-width: 768px)').matches ? ' open' : '';
  const list = items
    .map((h) => `<li class="toc-h${h.level}"><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`)
    .join('');
  return `
    <nav class="toc" aria-label="목차">
      <details${open}>
        <summary>목차</summary>
        <ol>${list}</ol>
      </details>
    </nav>`;
}

function renderPost(post) {
  const { html, headings } = parseMarkdown(post.body);
  const date = post.date
    ? `<time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>`
    : '';
  const tags = post.tags.length
    ? `<ul class="tag-list">${post.tags.map((tag) => `<li><a class="tag" href="index.html?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a></li>`).join('')}</ul>`
    : '';

  document.title = `${post.title} · My Blog`;
  if (post.description) {
    const meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = post.description;
    document.head.appendChild(meta);
  }

  app.innerHTML = `
    <article>
      <header class="post-header">
        <h1>${escapeHtml(post.title)}</h1>
        <div class="post-meta">${date}<span>${post.readingTime}분 분량</span></div>
        ${tags}
      </header>
      ${renderToc(headings)}
      <div class="prose">${html}</div>
    </article>
    <a class="back-link" href="index.html">← 목록으로</a>`;

  // 내용이 비동기로 그려지므로 주소의 #앵커 위치로 직접 이동한다
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
}

async function init() {
  const slug = new URLSearchParams(location.search).get('slug');
  let post = null;

  try {
    post = await loadPost(slug);
  } catch (error) {
    console.error(error);
    app.innerHTML = '<p class="status">글을 불러오지 못했어요. 로컬 서버(python3 -m http.server)로 열었는지 확인해 주세요.</p>';
    return;
  }

  if (post) {
    renderPost(post);
  } else {
    renderNotFound();
  }
}

init();
