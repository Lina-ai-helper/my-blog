// Created: 2026-09-21 19:36:42
const FRONTMATTER_RE = /^﻿?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/;

function unquote(value) {
  const match = value.match(/^(['"])([\s\S]*)\1$/);
  return match ? match[2] : value;
}

function parseValue(raw) {
  const value = raw.trim();
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => unquote(item.trim()))
      .filter(Boolean);
  }
  return unquote(value);
}

/**
 * 문서 맨 앞의 front matter를 읽는다.
 * `key: value`, `key: [a, b]`, 그리고 `- item` 형태의 목록을 지원한다.
 */
export function parseFrontmatter(text) {
  const match = String(text).match(FRONTMATTER_RE);
  if (!match) {
    return { data: {}, body: String(text) };
  }

  const data = {};
  let listKey = null;

  for (const line of (match[1] || '').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;

    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      data[listKey].push(unquote(item[1].trim()));
      continue;
    }

    const pair = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!pair) continue;

    const [, key, raw] = pair;
    if (raw.trim() === '') {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseValue(raw);
      listKey = null;
    }
  }

  return { data, body: String(text).slice(match[0].length) };
}
