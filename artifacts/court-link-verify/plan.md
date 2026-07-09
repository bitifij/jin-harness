# court-link-verify 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 딥링크 데이터 모델 | `Court.deepLinkTemplate: string` → `Court.bookingLinks: BookingLink[]` (dayType별 다중 링크) | spec 시나리오 5(요일유형별 링크)와 시나리오 1(ID 각각 점검)이 코트당 N개 링크를 요구. 단일 문자열 유지 + 옵션 필드 추가보다 배열 전환이 "검증 목록 = 노출 링크" 불변 규칙을 자동 파생으로 보장하기 쉬움 |
| 검증 HTTP 수단 | Bun `fetch` 대신 **curl 서브프로세스** (`lib/curl.ts` 래퍼) | gytennis TLS 체인 불완전으로 Node/Bun fetch가 100% 실패 (learnings.md 기록). curl은 OS 키체인 AIA fetching으로 성공 → "TLS 문제를 검증 실패로 오판하지 않는다" 불변 규칙을 충족. 소스별 수단을 나누는 것보다 전체 curl 통일이 판정 일관성 유지에 유리 |
| 판정 로직 배치 | 순수 판정 함수는 `services/verify/`(fixture로 단위 테스트), 네트워크·파일 IO는 `scripts/verify-courts.ts` CLI에 격리 | "기존 테스트는 네트워크 없이 통과" 불변 규칙. 판정(입력: HTTP 결과, 출력: 판정)을 순수 함수로 두면 지난번 소프트 404 사례를 fixture로 재현해 회귀 테스트 가능 |
| yeyak 데이터 조회 시 ID 선택 | 날짜의 요일(토·일 → weekend, 그 외 → weekday)로 `bookingLinks`에서 매칭 ID 선택 | 카드 UI는 링크 2개를 모두 노출하므로 공휴일 판정 불필요. 데이터 조회(잔여 면수)만 요일 매칭 — 공휴일이 평일 ID로 조회되는 한계는 미결정 항목에 기록 |
| 검증 상태 저장 위치 | 리포트 파일(`artifacts/court-link-verify/report.md`)에만 기록, `courts.ts`에는 검증 메타데이터를 두지 않음 | courts.ts에 lastVerifiedAt을 두면 매일 데이터 파일이 diff돼 커밋 노이즈 발생. 리포트만 매일 갱신·커밋하면 git 기록으로 이력 추적 가능 (사용자 결정: 리포트 + 커밋) |
| 숨김 처리 방식 | `Court.hidden?: boolean` + `hiddenReason?: string`, `aggregateCourts()`에서 필터 | 데이터 보존 불변 규칙 — 삭제 대신 플래그. 사유를 데이터에 남겨 복구 판단 근거 제공 |
| 자동 수리 실행 주체 | 코드가 아니라 **클라우드 루틴(스케줄드 에이전트) + 수리 절차 스킬** | 수리는 "사이트 검색 → 후보 검증 → 코드 수정 → 재검증 → 커밋" 판단이 필요한 작업 — 스크립트는 감지·후보 제시까지만, 수리는 Claude가 스킬 절차대로 수행 (사용자 결정: 자동 수정 + 커밋) |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| 매일 점검 루틴 | Scheduled cloud agent (claude.ai/code routine) | 루틴 프롬프트 (Task 8에서 등록) | Task 8 |
| GitHub 저장소 연결 | 루틴 실행 전제 (클라우드가 bitifij/jin-harness를 clone·push) | claude.ai GitHub 연동 | Task 8 (사용자 준비물) |

> 사용자 준비물: claude.ai에서 GitHub 계정 연동이 되어 있어야 함 (Task 8 실행 전 확인).

## 데이터 모델

### BookingLink (신규)
- dayType (required) — `'all' | 'weekday' | 'weekend'` (weekend = 주말·공휴일)
- urlTemplate (required) — `{date}` 플레이스홀더 허용
- expectedText — 소프트 404 판정용: 링크 접속 결과 페이지에 반드시 있어야 하는 문자열 (yeyak은 시설명)

### Court (변경)
- deepLinkTemplate 제거 → bookingLinks → BookingLink[] (required, 1개 이상)
- hidden?, hiddenReason? (신규) — 수리 불가 코트 숨김 (데이터 보존)
- searchKeyword? (신규) — yeyak 검색 ajax로 대체 ID를 찾을 때 쓰는 시설명 키워드

### VerifyResult (신규, services/verify 내부)
- target — 코트 id + 링크(dayType) 또는 데이터 엔드포인트
- verdict — `'ok' | 'broken' | 'changed'`
- reason — 상태 코드 / 리다이렉트 대상 / expectedText 미발견 등
- candidates? — verdict가 changed일 때 대체 ID 후보 목록 (시설명·회차 포함)

### RepairAction (신규, services/verify 내부)
- courtId (required)
- action (required) — `'fixed' | 'hidden'`
- detail (required) — 무엇을(필드·old→new) 왜(근거) 어떻게(조사 방법) 바꿨는지 서술
- timestamp (required)

> 리포트는 VerifyResult[](판정)와 RepairAction[](조치 내역)를 함께 담는다 — 시나리오 6 "무엇이 왜 어떻게 바뀌었는지"와 시나리오 7 "숨김 사유·시각 기록"의 근거 구조.

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | Task 2 | 카드 예약 버튼 2개 배치 — `components/ui/*` 직접 수정 금지, variant/token 우선 규칙 준수 |
| vercel-react-best-practices | Task 2 | 카드 컴포넌트 수정 시 성능 패턴 |
| skill-creator (플러그인) | Task 7 | 수리 절차 스킬 작성 형식 |
| schedule | Task 8 | 클라우드 루틴(스케줄드 에이전트) 등록 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/tennis.ts` | Modify (BookingLink, Court 확장) | 1, 3 |
| `config/courts.ts` | Modify (bookingLinks 전환, 잠원·광나루 평일 ID 추가) | 1 |
| `config/courts.test.ts` | Modify | 1 |
| `services/aggregate.ts` | Modify (ID 추출 → dayType 매칭, hidden 필터) | 1, 3 |
| `services/aggregate.test.ts` | Modify | 1, 3 |
| `components/tennis/court-card.tsx` | Modify (요일유형별 예약 버튼) | 1(컴파일 유지), 2 |
| `components/tennis/court-card.test.tsx` | Modify | 2 |
| `lib/curl.ts` + `lib/curl.test.ts` | New (curl 서브프로세스 래퍼: status·최종URL·body 반환) | 4 |
| `services/verify/judge.ts` + `.test.ts` | New (하드 실패·소프트 404 판정 순수 함수) | 4 |
| `services/verify/__fixtures__/*` | New (지난 장애 사례 재현 fixture) | 4, 5 |
| `services/verify/yeyak-search.ts` + `.test.ts` | New (검색 ajax 응답 파싱, 대체 후보 추출) | 5 |
| `services/verify/targets.ts` + `.test.ts` | New (courts config → 점검 항목 자동 파생) | 5 |
| `services/verify/report.ts` + `.test.ts` | New (리포트 md 생성) | 6 |
| `scripts/verify-courts.ts` | New (CLI: 조회→판정→리포트→exit code) | 6 |
| `package.json` | Modify (`verify:courts` 스크립트) | 6 |
| `artifacts/court-link-verify/report.md` | New (첫 실행 결과) | 6 |
| `.claude/skills/court-link-repair/SKILL.md` | New (수리 절차 스킬) | 7 |

> `scripts/`는 아키텍처 표(types→…→app)에 없는 신규 최상위 디렉토리 — `app/`과 같은 최상위 소비자로 취급, 모든 레이어 의존 허용·역방향 의존 없음.

## Tasks

### Task 1: BookingLink 모델 전환 + 잠원·광나루 실제 평일 ID 확보

- **담당 시나리오**: Scenario 5 (partial — 데이터 기반), Scenario 1의 "요일유형별 ID 각각이 점검 항목" 전제
- **크기**: M (6 파일, 대부분 기계적 전환)
- **의존성**: None
- **참조**:
  - learnings.md "JS 렌더링 검색도 결국 폼 뒤엔 평범한 POST 엔드포인트" — 검색 ajax `POST /web/search/selectPageListSvcMoreAjax.do`, `sch_text` 파라미터, 응답 `resultList[].SVC_ID`
  - learnings.md "딥링크 문자열에서 ID를 정규식으로 뽑는 코드(aggregate.ts)는 형식 변경 시 같이 확인"
- **구현 대상**:
  - `types/tennis.ts` — BookingLink 추가, Court.deepLinkTemplate → bookingLinks
  - `config/courts.ts` — 전 코트 bookingLinks 전환 (gytennis·양평누리는 dayType 'all' 1개, yeyak은 weekday/weekend). **잠원·광나루 평일 ID는 검색 ajax를 curl로 실조회해 확보** (기존 ID는 주말용으로 재분류, expectedText·searchKeyword 채움). 홍은테니스장도 같은 검색으로 요일유형별 ID 존재 여부를 확인해 반영
  - `services/aggregate.ts` — extractYeyakSvcId/extractGytennisCourtId를 날짜 요일유형 매칭 방식으로 교체
  - `components/tennis/court-card.tsx` — 컴파일 유지 최소 수정 (기존 단일 버튼 동작 보존, UI 확장은 Task 2)
  - `config/courts.test.ts`, `services/aggregate.test.ts` — 갱신
- **수용 기준**:
  - [x] 모든 코트가 1개 이상의 bookingLinks를 가지며, 잠원·광나루는 weekday·weekend 링크가 각각 존재한다 (실조회로 확보한 ID)
  - [x] 토요일 날짜의 yeyak 잔여 조회는 weekend ID로, 수요일 날짜는 weekday ID로 요청된다 (aggregate 테스트로 관찰)
  - [x] gytennis 날짜별 링크(`{date}` 치환)와 카드 예약 버튼 동작이 전환 전과 동일하다 (기존 테스트 전부 통과)
  - [x] 검색 ajax에서 평일 회차가 확인되지 않는 코트는 weekend 링크만 갖고, 그 사실이 courts.ts 주석에 기록된다
- **검증**: `bun run test` (전체 회귀), 실조회 증거 `artifacts/court-link-verify/evidence/task-1-yeyak-search.txt` (curl 응답 저장)

---

### Task 2: 카드 요일유형별 예약 링크 UI

- **담당 시나리오**: Scenario 5 (full)
- **크기**: S (2 파일)
- **의존성**: Task 1 (bookingLinks 모델)
- **참조**:
  - shadcn 스킬 — Button variant, `components/ui/*` 수정 금지
  - vercel-react-best-practices — 컴포넌트 수정 패턴
- **구현 대상**:
  - `components/tennis/court-card.tsx` — bookingLinks가 2개 이상이면 dayType별 버튼("평일 예약", "주말·공휴일 예약") 병렬 표시, 1개면 기존 단일 버튼
  - `components/tennis/court-card.test.tsx`
- **수용 기준**:
  - [x] weekday·weekend 링크 2개인 코트 카드 → "평일 예약"과 "주말·공휴일 예약" 버튼이 각각 표시된다
  - [x] 각 버튼의 href가 해당 dayType의 예약 페이지 URL이다
  - [x] 링크 1개(dayType 'all')인 코트 → 기존과 동일한 단일 예약 버튼이 표시된다
- **검증**: `bun run test -- court-card`, `bun run build`, Browser MCP — 모바일 폭(375px)에서 버튼 2개 배치가 넘치지 않는지 목측, 증거 `artifacts/court-link-verify/evidence/task-2-mobile.png`

---

### Task 3: 숨김 코트 앱 제외

- **담당 시나리오**: Scenario 7 (partial — 숨김의 앱 반영. 루틴의 숨김 판단·커밋은 Task 7·8)
- **크기**: S (3 파일)
- **의존성**: Task 1 (Court 타입 변경과 충돌 방지)
- **참조**: None
- **구현 대상**:
  - `types/tennis.ts` — hidden?, hiddenReason?
  - `services/aggregate.ts` — hidden 코트 필터
  - `services/aggregate.test.ts`
- **수용 기준**:
  - [x] hidden: true 코트는 반경 내에 있어도 API 응답(코트 목록)에 나타나지 않는다
  - [x] hidden 코트의 데이터는 config에 그대로 남아 있다 (타입이 삭제가 아닌 플래그를 강제)
- **검증**: `bun run test -- aggregate`

---

### Checkpoint: Tasks 1-3 이후
- [x] 모든 테스트 통과: `bun run test`
- [x] 빌드 성공: `bun run build`
- [x] 앱 실행(`bun dev`) 후 잠원·광나루 카드에 예약 버튼 2개가 보이고 각각 실제 yeyak 페이지로 연결됨 — Browser MCP로 확인, 증거 `artifacts/court-link-verify/evidence/checkpoint-1.png`

---

### Task 4: 링크 판정 코어 — 하드 실패·소프트 404

- **담당 시나리오**: Scenario 2 (판정 로직), Scenario 3 (full)
- **크기**: M (5 파일)
- **의존성**: Task 1 (BookingLink.expectedText)
- **참조**:
  - learnings.md "딥링크 사각지대" — 지난 장애 3종: gytennis 로그인 리다이렉트, 양평누리 404, yeyak 소프트 404
  - CLAUDE.md Testing — mock이 기준을 가리면 거기서 mock하지 않는다 → 판정 함수는 순수 함수로 두고 실제 HTTP 결과 모양의 fixture로 테스트
- **구현 대상**:
  - `lib/curl.ts` + `lib/curl.test.ts` — curl 서브프로세스 래퍼 (최종 상태코드·최종 URL·본문 반환, 리다이렉트 추적)
  - `services/verify/judge.ts` + `judge.test.ts` — (HTTP 결과, 점검 항목) → VerifyResult
  - `services/verify/__fixtures__/` — 지난 장애 사례 재현: 404 응답, 로그인 페이지 리다이렉트, 가짜 ID의 yeyak 200 페이지, 정상 페이지
- **수용 기준**:
  - [x] 404 응답 fixture → verdict 'broken' + 원인에 상태 코드
  - [x] 로그인 페이지로 리다이렉트된 fixture → verdict 'broken' + 원인에 리다이렉트 대상
  - [x] HTTP 200이지만 expectedText가 본문에 없는 fixture → verdict 'broken' (소프트 404)
  - [x] HTTP 200이고 expectedText가 본문에 있는 fixture → verdict 'ok'
- **검증**: `bun run test -- verify`, `bun run test -- curl`

---

### Task 5: yeyak 검색 후보 탐지 + 점검 항목 자동 파생

- **담당 시나리오**: Scenario 4 (판정·후보 추출 로직), Scenario 1의 "ID 각각 점검 항목" (targets)
- **크기**: M (5 파일)
- **의존성**: Task 4 (VerifyResult 타입), Task 1 (bookingLinks)
- **참조**:
  - learnings.md — 검색 ajax `POST /web/search/selectPageListSvcMoreAjax.do`, `sch_text`, 응답 `resultList[].SVC_ID` + 회차명(평일/주말 구분이 이름에 포함)
  - 불변 규칙 "검증 목록과 앱 노출 링크가 어긋나면 사각지대 재발" → 점검 항목은 courts config에서 **자동 파생** (수동 목록 금지)
- **구현 대상**:
  - `services/verify/yeyak-search.ts` + `.test.ts` — 검색 응답 JSON → 후보 목록(SVC_ID, 시설명, 회차명), 죽은 ID + 후보 존재 시 verdict 'changed'
  - `services/verify/__fixtures__/yeyak-search.json` — 실제 검색 응답 저장본
  - `services/verify/targets.ts` + `.test.ts` — courts → 점검 항목 (모든 bookingLinks × 코트 + 소스별 데이터 엔드포인트, hidden 코트는 "숨김 상태"로 표기만)
- **수용 기준**:
  - [x] 등록 ID가 broken이고 searchKeyword 검색 결과에 동일 시설 후보가 있으면 → verdict 'changed' + 후보 목록(ID·시설명·회차명)
  - [x] 검색 결과에 해당 시설이 없으면 → verdict 'broken' 유지 (후보 없음 — 수리 불가 신호)
  - [x] courts.ts에 코트·링크를 추가하면 점검 항목에 자동으로 나타난다 (targets 테스트)
  - [x] 요일유형별 링크가 2개인 코트는 점검 항목 2개로 확장된다
- **검증**: `bun run test -- yeyak-search`, `bun run test -- targets`

---

### Task 6: 검증 CLI + 리포트 — 실사이트 첫 점검

- **담당 시나리오**: Scenario 1 (full), Scenario 2 (exit code·부분 실패 격리), Scenario 4 (리포트 표기), Scenario 6·7의 "리포트 조치 내역 기록" 구조 제공
- **크기**: M (5 파일 + 생성물 report.md)
- **의존성**: Task 4, Task 5 (판정·검색·targets), Task 1 (bookingLinks)
- **참조**: None
- **구현 대상**:
  - `services/verify/report.ts` + `.test.ts` — VerifyResult[] + RepairAction[] → 리포트 md (실행 시각, 코트별 판정, 요약, **조치 내역 섹션**: 코트 id·액션(fixed/hidden)·사유·시각)
  - `scripts/verify-courts.ts` — curl 조회 → 판정 → 리포트 저장 → 콘솔 요약 → exit code
  - `package.json` — `"verify:courts": "bun scripts/verify-courts.ts"`
- **수용 기준**:
  - [x] 한 항목이 broken이어도 나머지 항목 점검이 계속되어 각자 ok로 판정되고, 요약에 실패 수가 집계되며 exit code 비0
  - [x] 전 항목 ok → 요약 "N개 점검, N개 정상", exit code 0, 리포트에 실행 시각 기록
  - [x] verdict 'changed'인 항목은 리포트에 대체 후보(ID·시설명·회차명)가 표시된다
  - [x] RepairAction(fixed/hidden)이 주어지면 리포트 조치 내역에 사유·시각과 함께 나타난다 (report 테스트)
- **검증**: `bun run test -- verify`, **실사이트 실행** `bun run verify:courts` → 전 항목 통과 (통과 못 하면 데이터를 고쳐서 통과시킨다 — 이 자체가 첫 점검), 출력 저장 `artifacts/court-link-verify/evidence/task-6-first-run.txt`

---

### Checkpoint: Tasks 4-6 이후
- [x] 모든 테스트 통과: `bun run test` (네트워크 없이)
- [x] 빌드 성공: `bun run build`
- [x] `bun run verify:courts` 실사이트 실행이 exit 0으로 끝나고 `artifacts/court-link-verify/report.md`가 생성됨 — 감지 체계가 end-to-end로 동작

---

### Task 7: 수리 절차 스킬 (court-link-repair)

- **담당 시나리오**: Scenario 6·7 (절차 정의 — 실행 경로는 Task 8)
- **크기**: S (1 파일)
- **의존성**: Task 6 (verify:courts 명령이 스킬의 진입점)
- **참조**:
  - skill-creator 스킬 — SKILL.md 형식
  - learnings.md의 수리 노하우 전체: 검색 ajax 직접 호출, 폼 핸들러 추적("headless 브라우저 단정 금지"), aggregate 정규식 결합, 요일유형별 ID 존재
- **구현 대상**:
  - `.claude/skills/court-link-repair/SKILL.md` — 절차: ① `bun run verify:courts` 실행 → ② broken/changed 항목별 조사 (changed면 후보 검증, broken이면 검색·사이트 탐색) → ③ courts.ts 수정 → ④ 재검증 실행해 통과 확인 → ⑤ **report.md 조치 내역에 RepairAction(무엇을 왜 어떻게, 시각) 기록** → ⑥ 수정+리포트를 함께 커밋. 수리 불가면 ③′ hidden 처리 + courts.ts에 hiddenReason → ⑤′ report.md 조치 내역에 숨김 사유·시각 기록 → ⑥′ 커밋. 삭제 금지·재검증 없는 커밋 금지 불변 규칙 명시
- **수용 기준**:
  - [x] 스킬 절차만 따라가면 시나리오 6(자동 수정+커밋)과 7(숨김+보고)의 성공 기준을 모두 충족할 수 있다 — 절차에 재검증·데이터 보존·리포트 기록 단계가 빠짐없이 존재
  - [x] 지난 장애 3종(하드 404, 리다이렉트, 소프트 404) 각각에 대한 조사 방법이 스킬에 담겨 있다
- **검증**: Human review — 사용자가 SKILL.md를 읽고 "이 절차로 지난번 사고를 처리할 수 있었겠는가" 기준으로 승인. dry-run: courts.ts의 ID 하나를 일부러 틀리게 바꾼 뒤 스킬 절차대로 복구되는지 1회 시연, 증거 `artifacts/court-link-verify/evidence/task-7-dryrun.md`

---

### Task 8: 클라우드 루틴 등록 — 매일 점검·수리

- **담당 시나리오**: Scenario 6 (full), Scenario 7 (full)
- **크기**: S (루틴 등록 + 프롬프트 작성)
- **의존성**: Task 6 (verify 명령), Task 7 (수리 스킬)
- **참조**:
  - schedule 스킬 — 스케줄드 클라우드 에이전트 등록
  - 사용자 git 규칙: 브랜치/PR 없이 main에 직접 push
- **구현 대상**:
  - 클라우드 루틴 (매일 오전 1회): "저장소에서 `bun run verify:courts` 실행 → 실패 항목이 있으면 court-link-repair 스킬 절차로 수리 또는 숨김 → 리포트·수정을 main에 커밋·push. 재검증 통과 없이는 수정을 커밋하지 않는다. 코트 데이터 삭제 금지."
- **수용 기준**:
  - [x] 루틴이 매일 1회 스케줄로 등록되어 목록에서 확인된다
  - [ ] 수동 트리거 1회 실행 → 리포트 커밋이 main에 push되고, 커밋 내역과 리포트 기록이 일치한다
  - [ ] (실패 주입 시연) courts.ts에 깨진 ID를 하나 넣고 트리거 → 루틴이 수정 또는 숨김 커밋을 만들고, 수정된 값은 재검증을 통과한다
  - [ ] 숨김 처리가 일어난 경우 report.md 조치 내역에 해당 코트의 숨김 사유와 시각이 나타난다
- **검증**: 루틴 목록 확인 + 수동 트리거 실행 후 git log·report.md 확인, 증거 `artifacts/court-link-verify/evidence/task-8-routine.md`

---

## 미결정 항목

- **공휴일의 데이터 조회 정확도**: 카드 링크는 두 개 다 노출되므로 문제없으나, 평일에 낀 공휴일의 잔여 면수는 weekday ID로 조회되어 실제(주말·공휴일 회차)와 다를 수 있다. 공휴일 달력 의존성을 넣을 만큼의 가치가 있는지 보류 — 운영하며 판단
- **클라우드 루틴 환경 제약**: 클라우드 실행 환경에서 한국 공공 사이트 접근·bun 실행이 가능한지 Task 8 첫 실행에서 확인 — 불가하면 로컬 스케줄로 전환 (아키텍처는 CLI 명령 하나에 격리되어 있어 전환 비용 낮음)
- **gytennis TLS (기존 이슈)**: 검증 체계는 curl로 우회하지만, **앱 프로덕션 배포의 fetch 실패는 여전히 미해결** — 이 feature 범위 밖, tennis-radar plan.md에 기록된 상태 유지
