// Created: 2026-09-21 19:36:58
import { escapeHtml } from './utils.js';

const JS_KEYWORDS = new Set((
  'async await break case catch class const continue debugger default delete do else ' +
  'export extends false finally for from function if import in instanceof let new null ' +
  'of return static super switch this throw true try typeof undefined var void while with yield'
).split(' '));

const STRING_RE = /'(?:\\.|[^'\\\n])*'?|"(?:\\.|[^"\\\n])*"?/y;
const WHITESPACE_RE = /\s+/y;

function matchAt(re, code, pos) {
  re.lastIndex = pos;
  const match = re.exec(code);
  return match ? match[0] : null;
}

/**
 * 코드를 앞에서부터 한 번만 훑는다.
 * step이 토큰을 돌려주면 그만큼 건너뛰고, 못 찾으면 한 글자를 일반 텍스트로 넘긴다.
 */
function scan(code, step) {
  let out = '';
  let plain = '';
  let pos = 0;

  const flush = () => {
    if (plain) {
      out += escapeHtml(plain);
      plain = '';
    }
  };

  while (pos < code.length) {
    const token = step(code, pos);
    if (token && token.text) {
      if (token.cls) {
        flush();
        out += `<span class="tok-${token.cls}">${escapeHtml(token.text)}</span>`;
      } else {
        plain += token.text;
      }
      pos += token.text.length;
    } else {
      plain += code[pos];
      pos += 1;
    }
  }

  flush();
  return out;
}

function highlightJs(code) {
  return scan(code, (s, pos) => {
    let t;
    if ((t = matchAt(/\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y, s, pos))) return { text: t, cls: 'comment' };
    if ((t = matchAt(STRING_RE, s, pos))) return { text: t, cls: 'string' };
    if ((t = matchAt(/`(?:\\[\s\S]|[^`\\])*`?/y, s, pos))) return { text: t, cls: 'string' };
    if ((t = matchAt(/(?:0[xX][\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)n?/y, s, pos))) return { text: t, cls: 'number' };
    if ((t = matchAt(/[A-Za-z_$][\w$]*/y, s, pos))) return { text: t, cls: JS_KEYWORDS.has(t) ? 'keyword' : null };
    return null;
  });
}

function highlightCss(code) {
  let depth = 0;
  let inValue = false;
  let expectColon = false;

  return scan(code, (s, pos) => {
    let t;
    if ((t = matchAt(WHITESPACE_RE, s, pos))) return { text: t };
    if ((t = matchAt(/\/\*[\s\S]*?(?:\*\/|$)/y, s, pos))) return { text: t, cls: 'comment' };

    const ch = s[pos];
    if (ch === ':' && expectColon) {
      expectColon = false;
      inValue = true;
      return { text: ch };
    }
    expectColon = false;

    if ((t = matchAt(STRING_RE, s, pos))) return { text: t, cls: 'string' };
    if (ch === '{') {
      depth += 1;
      inValue = false;
      return { text: ch };
    }
    if (ch === '}') {
      depth = Math.max(0, depth - 1);
      inValue = false;
      return { text: ch };
    }
    if (ch === ';') {
      inValue = false;
      return { text: ch };
    }

    if (inValue) {
      if ((t = matchAt(/!important/y, s, pos))) return { text: t, cls: 'keyword' };
      if ((t = matchAt(/#[\da-fA-F]{3,8}\b|-?\d*\.?\d+(?:%|[a-zA-Z]+)?/y, s, pos))) return { text: t, cls: 'number' };
      if ((t = matchAt(/[\w-]+/y, s, pos))) return { text: t };
      return null;
    }

    if ((t = matchAt(/@[\w-]+/y, s, pos))) return { text: t, cls: 'keyword' };
    // 중괄호 안에서 `이름: 값;` 형태면 속성, 아니면 (중첩) 선택자
    if (depth > 0 && (t = matchAt(/-{0,2}[a-zA-Z][\w-]*(?=\s*:[^{};]*(?:[;}]|$))/y, s, pos))) {
      expectColon = true;
      return { text: t, cls: 'attr' };
    }
    if ((t = matchAt(/::?[\w-]+/y, s, pos))) return { text: t, cls: 'keyword' };
    if ((t = matchAt(/[.#]?-?[a-zA-Z_][\w-]*/y, s, pos))) return { text: t, cls: 'tag' };
    if ((t = matchAt(/\d+(?:\.\d+)?(?:%|[a-zA-Z]+)?/y, s, pos))) return { text: t, cls: 'number' };
    return null;
  });
}

function highlightHtml(code) {
  let inTag = false;

  return scan(code, (s, pos) => {
    let t;
    if (!inTag) {
      if ((t = matchAt(/<!--[\s\S]*?(?:-->|$)/y, s, pos))) return { text: t, cls: 'comment' };
      if ((t = matchAt(/<!DOCTYPE[^>]*>/iy, s, pos))) return { text: t, cls: 'keyword' };
      if ((t = matchAt(/<\/?[a-zA-Z][\w-]*/y, s, pos))) {
        inTag = true;
        return { text: t, cls: 'tag' };
      }
      if ((t = matchAt(/[^<]+/y, s, pos))) return { text: t };
      return null;
    }

    if ((t = matchAt(WHITESPACE_RE, s, pos))) return { text: t };
    if ((t = matchAt(/\/?>/y, s, pos))) {
      inTag = false;
      return { text: t, cls: 'tag' };
    }
    if ((t = matchAt(STRING_RE, s, pos))) return { text: t, cls: 'string' };
    if ((t = matchAt(/[^\s"'=<>/]+/y, s, pos))) return { text: t, cls: 'attr' };
    return null;
  });
}

const LANGUAGES = {
  js: highlightJs,
  javascript: highlightJs,
  mjs: highlightJs,
  jsx: highlightJs,
  ts: highlightJs,
  typescript: highlightJs,
  json: highlightJs,
  css: highlightCss,
  html: highlightHtml,
  xml: highlightHtml,
  svg: highlightHtml
};

/** 지원하는 언어면 토큰에 색을 입히고, 아니면 이스케이프만 한다. */
export function highlight(code, lang) {
  const fn = LANGUAGES[String(lang || '').toLowerCase()];
  return fn ? fn(code) : escapeHtml(code);
}
