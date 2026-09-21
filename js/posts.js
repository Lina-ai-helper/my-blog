// Created: 2026-09-21 19:37:56
import { parseFrontmatter } from './frontmatter.js';

const POSTS_DIR = 'posts/';
const SLUG_RE = /^[a-z0-9-]+$/;

export function isValidSlug(slug) {
  return typeof slug === 'string' && SLUG_RE.test(slug);
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(String).filter(Boolean);
  if (typeof tags === 'string' && tags.trim()) return tags.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

function stripCode(body) {
  return body.replace(/^ {0,3}(`{3,}|~{3,})[\s\S]*?^ {0,3}\1/gm, '');
}

/** 한글은 분당 500자, 영문은 분당 200단어 기준. 코드 블록은 빼고 센다. */
export function readingTime(body) {
  const text = stripCode(body);
  const korean = (text.match(/[ㄱ-ㆎ가-힣]/g) || []).length;
  const words = (text.match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.ceil(korean / 500 + words / 200));
}

/** description이 없을 때 본문 첫 문단으로 요약을 만든다. */
function summarize(body) {
  const paragraph = stripCode(body)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !/^(#|>|[-*+]\s|\d+[.)]\s|\||!\[)/.test(p)) || '';
  const plain = paragraph
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
}

export function formatDate(date) {
  const m = String(date).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : String(date);
}

/** 글 하나를 불러온다. slug가 잘못됐거나 파일이 없으면 null. */
export async function loadPost(slug) {
  if (!isValidSlug(slug)) return null;

  const res = await fetch(`${POSTS_DIR}${slug}.md`, { cache: 'no-cache' });
  if (!res.ok) return null;

  const { data, body } = parseFrontmatter(await res.text());
  return {
    slug,
    title: String(data.title || slug),
    date: String(data.date || ''),
    tags: normalizeTags(data.tags),
    description: String(data.description || summarize(body)),
    body,
    readingTime: readingTime(body)
  };
}

/** posts/index.json에 적힌 글을 모두 불러와 최신순으로 정렬한다. */
export async function loadPostList() {
  const res = await fetch(`${POSTS_DIR}index.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`index.json을 불러오지 못했어요 (${res.status})`);

  const slugs = await res.json();
  if (!Array.isArray(slugs)) throw new Error('index.json은 slug 배열이어야 해요');

  const posts = await Promise.all(slugs.map((slug) => loadPost(slug).catch(() => null)));
  return posts
    .filter(Boolean)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}
