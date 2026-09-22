<!-- Created: 2026-09-22 -->
# 픽셀 아트 에디터 — Review 결과

> Build를 수행한 에이전트와 별개의 독립 검증자로서, spec.md 대조 + 코드 레벨 점검 + 실제 브라우저(Chrome, CDP로 직접
> 구동) 동작 검증을 수행했다. Build 에이전트의 "콘솔 에러 없음, 드래그/지우개/undo/PNG 다운로드 동작, 375px·1000px
> 레이아웃 확인" 자체 보고를 의심하고 처음부터 다시 검증했다.

## 검증 방법

이 환경에서는 `mcp__claude-in-chrome__*` 도구(브라우저 확장 프로그램)가 연결되지 않아(확장 프로그램
미연결 오류) 지침이 제안한 방식을 그대로 쓸 수 없었다. 대신 로컬에 설치된 실제 Google Chrome을
`--headless=new --remote-debugging-port=9222`로 직접 띄우고, Node.js(내장 `fetch`/`WebSocket`)로 Chrome
DevTools Protocol(CDP)에 직접 접속해 같은 수준(실제 브라우저의 진짜 이벤트 파이프라인)으로 검증했다.
`Input.dispatchMouseEvent`/`Input.dispatchTouchEvent`/`Input.dispatchKeyEvent`로 실제(trusted) 마우스·터치·
키보드 이벤트를 보냈고, `Emulation.setDeviceMetricsOverride`로 뷰포트를 바꿨으며, `Browser.setDownloadBehavior`로
실제 PNG 다운로드를 받아 Python(PIL)으로 픽셀 데이터까지 열어봤다. 로컬 서버(`python3 -m http.server 8000`)와
headless Chrome은 검증 종료 후 모두 종료했고, 테스트로 받은 PNG 파일도 삭제했다(스크래치패드 밖으로는 나가지
않았음).

## 검증 항목별 결과

| 항목 | 결과 | 비고 |
|---|---|---|
| 16x16 격자, 1차원 `cells` 배열, `index = y*16+x` | 통과 | grid.js 코드 대조 확인 |
| Pointer Events 기반 마우스 드래그로 연속 칠하기 | 통과 | 실제 `Input.dispatchMouseEvent`로 5칸 연속 드래그 → 전 칸 정상 채색 |
| 빠른 드래그 시 칸 누락 방지(보간) | 통과 | (0,10)→(10,10) 한 번의 큰 점프만 보냈는데도 중간 셀(5,10)까지 브레젠험 보간으로 채색됨 |
| 터치 드래그로 연속 칠하기 | 통과 | `Input.dispatchTouchEvent`(touchStart/Move/End)로 3칸 연속 채색 확인, `touch-action:none` 덕에 페이지 스크롤(`scrollY`) 미발생 |
| 프리셋 팔레트 선택 반영 | 통과 | 빨강 스와치 클릭 → `aria-pressed="true"` 전환 + 실제 칠한 픽셀이 `#e5352b`로 렌더링됨 |
| 커스텀 색상 picker 동작 | 통과 | `<input type=color>`에 `#00ff00` 설정 후 `input` 이벤트 dispatch → 커스텀 스와치 생성/갱신, 선택 상태 반영, 실제 칠한 픽셀이 `(0,255,0,255)`로 렌더링됨 |
| 지우개 모드 동작 + 색상 선택 시 자동 해제 | 통과 | 지우개 on → 칠했던 칸이 투명(alpha 0)으로 복원, 이후 다른 색 선택 시 `eraser-btn`의 `aria-pressed`가 `false`로 자동 복귀 |
| 전체 지우기(확인 절차 포함) | 통과 | `confirm()` 다이얼로그 실제 발생 확인(`Page.javascriptDialogOpening` 캡처: "그림 전체를 지울까요? ..."). 수락 시 전체 삭제 + `aria-live` 안내("전체 지우기 완료") / **취소(dismiss) 시 그림이 그대로 남아있음도 별도 검증** |
| undo(버튼) | 통과 | 클릭 시 직전 스트로크가 실제로 되돌려짐(픽셀 alpha 0으로 복귀), `aria-live` 안내("되돌리기 완료") |
| undo(Ctrl+Z) | 통과 | 실제 `Input.dispatchKeyEvent`로 Ctrl+Z 전송 → 동일하게 되돌려짐 |
| undo 스택 비면 버튼 비활성화 | 통과 | 스트로크 2회 → undo 2회 클릭 후 `disabled === true` 확인, 빈 상태에서 추가 클릭해도 예외 없음 |
| PNG 저장 — 실제 다운로드 | 통과 | `Browser.setDownloadBehavior`로 실제 파일 다운로드 완료(`pixel-art.png`, 2389 bytes) |
| PNG 저장 — 크기/투명 배경 | 통과 | PIL로 직접 열어 확인: 256×256, RGBA(colorType 6), 그림 안 그린 영역은 완전 투명(alpha 0), 그린 칸은 정확한 색·정확한 셀 위치에 위치 |
| CSS 격자 구분선 | 통과 | 격자선이 캔버스가 아닌 `.canvas-wrap`의 `repeating`형 `linear-gradient` 배경으로 그려져 있어 PNG에 섞이지 않음(코드+실제 다운로드 PNG 양쪽에서 확인) |
| 반응형 1단/2단 레이아웃, 가로 스크롤 없음 | 통과 | 375px: `scrollWidth === clientWidth`(가로 스크롤 없음), 캔버스가 팔레트보다 위(1단). 900px: 팔레트가 캔버스 오른쪽(2단), 가로 스크롤 없음 |
| 44px 터치 타깃 | 통과 | 375px 뷰포트에서 모든 스와치/버튼이 44×44 이상(swatch 46×46, 버튼 168×44 등)으로 측정됨 |
| `:focus-visible` 스타일 | 통과 | 실제 Tab 키 입력으로 포커스 이동 후 `outline: solid 3px`가 적용됨을 확인(단순 `.focus()` 프로그램적 포커스로는 Chrome이 `:focus-visible`을 매칭하지 않는 것이 정상 동작이라 실제 키보드 이벤트로 재검증함) |
| `aria-pressed`/`aria-label` | 통과 | 스와치·지우개 버튼 모두 존재, 선택 상태와 동기화됨 |
| `aria-live="polite"` 상태 안내 | 통과 | 지우기/undo/저장 시 실제로 텍스트가 갱신됨을 확인 |
| WCAG AA(4.5:1) 대비 — UI 텍스트/버튼 | 통과 | 본문(12.88:1), 흐린 텍스트(4.85:1, 패널 위 5.33:1), 버튼 텍스트(11.78:1), accent 위 흰 글자(5.31:1) 모두 4.5:1 이상 (팔레트 스와치 자체는 지침대로 예외 처리) |
| `prefers-reduced-motion` | 통과 | 해당 미디어 특성을 `reduce`로 에뮬레이트하면 `.tool-btn`의 `transitionDuration`이 `0s`로 바뀜 |
| 콘솔 에러 없음 | 통과 | 모든 시나리오(로드, 드래그, 터치, undo, 저장, 지우기 취소 포함)에서 `Runtime.exceptionThrown`/콘솔 에러 0건 |
| 코드 스타일(2칸 들여쓰기/세미콜론/작은따옴표/`const`·`let`/kebab-case/`!important` 금지) | 통과 | 7개 파일 전체 grep: 탭 문자 없음, `var` 없음, `!important` 없음, 문자열은 전부 작은따옴표(주석 내 설명용 큰따옴표만 존재) |
| XSS/불필요한 `innerHTML` 등 | 통과 | 7개 파일 전체에서 `innerHTML`/`outerHTML`/`insertAdjacentHTML`/`document.write`/`eval` 미사용. 사용자 입력을 그대로 DOM에 삽입하는 경로 없음(팔레트 이름은 코드에 하드코딩된 상수, 색상 값은 `<input type=color>`가 항상 `#rrggbb` 형식으로만 반환하므로 `javascript:` 등 주입 경로 없음) |
| 함수 단일 책임 / 모듈 분리 | 통과 | spec대로 grid(순수 상태)/canvas(렌더링)/palette(도구 상태)/pointer(입력)/editor(오케스트레이션)로 깔끔히 분리되어 있고 각 함수가 짧고 한 가지 일만 함 |

## 발견 후 수정한 문제

없음. 코드 레벨 대조와 실제 브라우저(CDP) 동작 검증 모두에서 spec.md의 필수 기능·접근성·반응형·코드
스타일·보안 요구사항을 위반하는 문제를 발견하지 못했다.

## 수정하지 않고 남겨둔 문제 (참고용 — 기능 결함 아님)

사소하고 설계 변경이 필요할 정도도 아니지만, 향후 참고할 만한 관찰 사항을 기록한다(수정 안 함):

- `pointer.js`의 `pointerdown` 핸들러가 `event.preventDefault()`를 호출한다. 이 때문에 마우스로 캔버스를
  클릭해서 그림을 그리기 시작해도 캔버스에 브라우저 기본 포커스가 가지 않을 수 있다(Tab 키로는 정상적으로
  포커스된다). spec 6장에서 캔버스 키보드 그리기는 "선택적 향후 개선 과제"로 이미 비범위 처리되어 있어
  현재는 실질적 영향이 없다.
- `pointToCell`의 좌표 클램프 범위가 `[-1, GRID_SIZE]`(즉 16까지 포함)라서, 포인터가 캔버스 가장자리를
  살짝 벗어나면 격자 밖 인덱스(16)가 계산될 수 있다. 다만 `grid.js`의 `setCell`이 `isInBounds`로 걸러내
  실제로는 아무 효과가 없어 버그로 이어지지 않는다.
- `handleClear`는 격자가 이미 비어 있으면 `confirm()` 없이 조용히 아무 일도 하지 않는다(spec에 명시된
  동작은 아니지만 위반도 아님 — 사용자 판단이 필요한 사안은 아니라고 보고 그대로 둠).

## 최종 결론

**이 앱을 블로그에 Embed(연결)해도 되는 상태다.** spec.md에 명시된 필수 기능(16x16 격자, Pointer Events
기반 마우스/터치 통합 드래그+보간, 프리셋+커스텀 팔레트, 지우개, 전체 지우기, 스트로크 단위 undo(버튼+
단축키), PNG 저장(오프스크린 재렌더링, 투명 배경, 구분선 미포함)) 전부가 실제 브라우저 환경에서 정상
동작함을 직접 확인했다. 반응형 레이아웃(375px/900px 모두 가로 스크롤 없음), 접근성 요구사항(포커스
표시, `aria-pressed`/`aria-live`, 대비율, 44px 터치 타깃, reduced-motion), 코드 스타일, XSS 방지 요구사항도
모두 충족한다. Build 에이전트의 자체 보고와 실제 동작 사이에 불일치는 발견되지 않았다.
