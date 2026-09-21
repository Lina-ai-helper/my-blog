// Created: 2026-09-21 19:38:06
import { loadPostList, formatDate } from './posts.js';
import { escapeHtml } from './utils.js';

const app = document.getElementById('app');
let posts = [];
let activeTag = new URLSearchParams(location.search).get('tag') || '';

function tagLinks(tags) {
  if (!tags.length) return '';
  const items = tags
    .map((tag) => `<li><a class="tag" href="index.html?tag=${encodeURIComponent(tag)}" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</a></li>`)
    .join('');
  return `<ul class="tag-list">${items}</ul>`;
}

function postCard(post) {
  const date = post.date
    ? `<time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date))}</time>`
    : '';
  return `
    <li class="post-card">
      <article>
        <h2><a href="post.html?slug=${post.slug}">${escapeHtml(post.title)}</a></h2>
        <div class="post-meta">${date}<span>${post.readingTime}분 분량</span></div>
        ${post.description ? `<p>${escapeHtml(post.description)}</p>` : ''}
        ${tagLinks(post.tags)}
      </article>
    </li>`;
}

function renderLayout() {
  const tags = [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) => a.localeCompare(b, 'ko'));
  const chip = (tag, label) =>
    `<li><button class="tag" type="button" data-tag="${escapeHtml(tag)}" aria-pressed="false">${escapeHtml(label)}</button></li>`;

  app.innerHTML = `
    <h1 class="page-title" id="page-title"></h1>
    ${tags.length ? `<nav aria-label="태그"><ul class="tag-filter">${chip('', '전체')}${tags.map((t) => chip(t, `#${t}`)).join('')}</ul></nav>` : ''}
    <ul class="post-list" id="post-list" aria-live="polite"></ul>`;
}

function renderList() {
  const visible = activeTag ? posts.filter((post) => post.tags.includes(activeTag)) : posts;

  document.getElementById('page-title').textContent = activeTag ? `#${activeTag}` : '모든 글';
  document.title = activeTag ? `#${activeTag} · My Blog` : 'My Blog';

  for (const button of app.querySelectorAll('.tag-filter .tag')) {
    button.setAttribute('aria-pressed', String(button.dataset.tag === activeTag));
  }

  const list = document.getElementById('post-list');
  list.innerHTML = visible.length
    ? visible.map(postCard).join('')
    : `<li class="status">${activeTag ? `'${escapeHtml(activeTag)}' 태그가 붙은 글이 없어요.` : '아직 글이 없어요.'}</li>`;
}

function setTag(tag) {
  activeTag = tag;
  const url = tag ? `?tag=${encodeURIComponent(tag)}` : location.pathname;
  history.replaceState(null, '', url);
  renderList();
}

async function init() {
  try {
    posts = await loadPostList();
  } catch (error) {
    console.error(error);
    app.innerHTML = '<p class="status">글 목록을 불러오지 못했어요. 로컬 서버(python3 -m http.server)로 열었는지 확인해 주세요.</p>';
    return;
  }

  renderLayout();
  renderList();

  // 태그 칩과 카드의 태그 링크 모두 새로고침 없이 필터를 바꾼다
  app.addEventListener('click', (event) => {
    const target = event.target.closest('[data-tag]');
    if (!target) return;
    event.preventDefault();
    setTag(target.dataset.tag);
    if (target.tagName === 'A') {
      window.scrollTo({ top: 0 });
    }
  });
}

init();
