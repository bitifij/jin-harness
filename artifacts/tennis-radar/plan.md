# Tennis Radar 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 데이터 수집 위치 | Next.js Route Handler(서버) | 세 소스는 CORS·HTML 파싱 필요 → 브라우저 직접 fetch 불가. 서버에서 긁어 정규화 후 JSON 반환 |
| HTML 파싱 | `node-html-parser` (경량) | gytennis는 셀 내 아이콘 유무(DOM)로 상태 판별해야 함 → 정규식 불가, 실제 DOM 쿼리 필요. cheerio보다 가벼움 |
| 소스 추상화 | `ReservationSource` 인터페이스 (소스별 구현) | 3소스의 세밀도가 달라도(슬롯/날짜) 공통 정규화 모델로 반환 → UI는 소스 무관 |
| 날씨 추상화 | `WeatherProvider` 인터페이스, 기본 = 기상청 단기예보 | 제공자 교체 가능하게. 키만 env로. 강수확률·강수량 → 이모지 단계 매핑은 lib에서 |
| 파서 테스트 | 실제 페이지 raw HTML fixture 기반 | 네트워크 없이 결정적 테스트. 수용 기준(파싱 정확도)을 mock 없이 증명 (CLAUDE.md 테스트 원칙) |
| 정적 등록 데이터 | `config/courts.ts` (좌표·코트ID·rsv_svc_id·URL·예약단위·정적 코트정보) | rsv_svc_id/좌표는 API로 못 얻음 → 수동 큐레이션. 미결정(수집 범위)은 config 확장으로 흡수 |
| 클라이언트/서버 경계 | 페이지는 RSC 셸, 상호작용(위치·필터·모달)은 client island | next-best-practices RSC 경계. 위치/필터 상태는 클라이언트, 데이터 fetch는 서버 route |
| 상태 관리 | React state + URL 없이 클라이언트 훅 | 모수 작고 단일 화면 → 전역 스토어 불필요 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `WEATHER_API_KEY` | Env var | `.env.local` (+ `.env.example`) | Task 5 |
| 기상청 단기예보 | 외부 API (공공데이터포털 발급키) | `services/weather/kma.ts` | Task 5 |

> 사용자 준비물: 공공데이터포털에서 기상청 단기예보 API 키 발급 → `.env.local`에 `WEATHER_API_KEY` 설정. (Task 5 실행 전 필요)

## 데이터 모델

### Court (정적 config + 런타임 병합)
- id (required)
- name, source ('gytennis'|'yangpyeong'|'yeyak')
- lat, lng (required) — 거리·날씨 조회 기준
- deepLinkTemplate (required)
- slotUnitMinutes (60|120|혼합) — 요일별 다를 수 있음
- info: { address?, courtCount?, surface?, fee?, hours?, phone? } — 소스 제공 범위만

### DayAvailability (소스 파싱 결과, 코트×날짜)
- date (YYYY-MM-DD)
- kind ('slot'|'count'|'unavailable') — slot=시간칩, count=N면, unavailable=로드실패
- slots?: Slot[] (kind='slot')
- remaining?, capacity? (kind='count', yeyak)
- loadError?: boolean

### Slot
- start, end (HH:mm) — 코트 실제 단위(1h/2h)
- available (boolean)

### WeatherHint (코트×시간블록)
- hourFrom, hourTo
- tier ('clear'|'cloudy'|'rain'|'heavy') → 이모지·색상
- pop (강수확률 %), precip (강수량 mm) — 툴팁용

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| next-best-practices | 6, 12 | Route Handler, RSC/Client 경계, async APIs, fetch 캐싱 |
| shadcn | 7, 8, 9, 10, 12 | Card·Badge·Button·Slider·Calendar·Dialog·Popover·Tooltip 설치·조합 |
| .claude/rules/shadcn-guard | 7-12 (tsx 작성 전체) | ui 소스 직접수정 금지, variant/semantic token 우선 |
| vercel-composition-patterns | 7, 8, 12 | 컴포넌트 합성, client island 경계 최소화 |
| vercel-react-best-practices | 8, 9, 10 | 훅·상태·이벤트 패턴 |
| web-design-guidelines | 7, 8 | 카드 정보 계층·접근성 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/tennis.ts` | New | 1 |
| `config/courts.ts` | New | 1 |
| `lib/geo.ts` (haversine), `lib/date.ts` | New | 1 |
| `lib/parsers/{gytennis,yangpyeong,yeyak}.ts` + `.test.ts` | New | 2,3,4 |
| `lib/parsers/__fixtures__/*.html` | New | 2,3,4 |
| `lib/weather/emoji.ts` + `.test.ts` | New | 5 |
| `services/sources/{gytennis,yangpyeong,yeyak}.ts` | New | 2,3,4 |
| `services/weather/kma.ts`, `services/weather/index.ts` | New | 5 |
| `services/aggregate.ts` | New | 6 |
| `app/api/courts/route.ts` + test | New | 6 |
| `components/tennis/*` + colocated tests | New | 7-11 |
| `hooks/{useGeolocation,useCourtFilters}.ts` | New | 8,9,10 |
| `app/page.tsx` | Modify | 12 |
| `e2e/tennis-radar.spec.ts` | New | 12 |
| `.env.example` | New | 5 |

## Tasks

### Task 1: 도메인 기반 — 타입·코트 config·거리/날짜 유틸
- **담당 시나리오**: 공통 기반 (Scenario 1·4의 거리/반경 계산 근거)
- **크기**: M
- **의존성**: None
- **참조**: (프로젝트: CLAUDE.md 아키텍처 레이어)
- **구현 대상**:
  - `types/tennis.ts` (Court, DayAvailability, Slot, WeatherHint)
  - `config/courts.ts` (gytennis 10 + 양평누리 + yeyak 시드; 좌표·딥링크·예약단위·정적 info)
  - `lib/geo.ts` (haversine 거리 km), `lib/geo.test.ts`
  - `lib/date.ts` (오늘/평일·주말 프리셋 날짜 생성, YYYY-MM-DD 포맷), `lib/date.test.ts`
- **수용 기준**:
  - [ ] 여의도 트윈타워 좌표와 특정 코트 좌표로 haversine 계산 시 알려진 거리(±0.1km)와 일치
  - [ ] "평일" 프리셋이 주어진 기준일부터 조회범위 내 평일 날짜 목록만 반환
  - [ ] config의 모든 코트가 필수 필드(id·source·lat·lng·deepLinkTemplate)를 가진다
- **검증**: `bun run test -- lib/geo lib/date`

---

### Task 2: gytennis 현황 파싱·수집 (fixture)
- **담당 시나리오**: Scenario 6 (슬롯 데이터 파싱 부분), 14 (파싱 실패)
- **크기**: M — 최고위험(아이콘 유무 판별). fail-fast로 먼저
- **의존성**: Task 1 (타입)
- **참조**: (프로젝트: spec.md 의존성 — gytennis `/daily/{id}/{date}`)
- **구현 대상**:
  - `lib/parsers/gytennis.ts` (HTML → 코트면×시간슬롯, 셀 내 아이콘 요소 유무로 available 판별)
  - `lib/parsers/__fixtures__/gytennis-daily.html` (실제 페이지 raw HTML 저장)
  - `lib/parsers/gytennis.test.ts`
  - `services/sources/gytennis.ts` (fetch + 파서 호출 → DayAvailability, 실패 시 loadError)
- **수용 기준**:
  - [ ] fixture에서 특정 날짜의 시간대별 예약가능 슬롯 수가 달력의 "가능 N"과 일치한다
  - [ ] 한 시간대에 ≥1면 available이면 그 시간칩이 available로 집계된다
  - [ ] 예약단위(2h) 경계가 06:00~22:00 8슬롯으로 파싱된다
  - [ ] fetch 실패/HTML 구조 불일치 시 loadError=true인 DayAvailability를 반환한다
- **검증**: `bun run test -- lib/parsers/gytennis`

---

### Task 3: 양평누리 현황 파싱·수집 (fixture)
- **담당 시나리오**: Scenario 6 (슬롯 파싱)
- **크기**: M
- **의존성**: Task 1
- **참조**: (프로젝트: spec.md — 양평누리 `srent.y-sisul.or.kr` 텍스트 `예약가능(n)/예약완료/기간종료`)
- **구현 대상**:
  - `lib/parsers/yangpyeong.ts` (텍스트 상태 → 슬롯 available)
  - `lib/parsers/__fixtures__/yangpyeong-daily.html`
  - `lib/parsers/yangpyeong.test.ts`
  - `services/sources/yangpyeong.ts`
- **수용 기준**:
  - [ ] `예약가능` 텍스트 슬롯은 available=true, `예약완료`·`기간종료`는 false로 파싱된다
  - [ ] 하루 8슬롯(2h)이 날짜별로 파싱된다
  - [ ] 실패 시 loadError=true 반환
- **검증**: `bun run test -- lib/parsers/yangpyeong`

---

### Checkpoint: Tasks 1-3 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 두 슬롯 소스가 raw HTML fixture → 정규화 슬롯 데이터로 변환됨 (파싱 리스크 조기 검증)

---

### Task 4: yeyak 현황 파싱·수집 (fixture)
- **담당 시나리오**: Scenario 8 (N면 파싱), 12 (0면)
- **크기**: M
- **의존성**: Task 1
- **참조**: (프로젝트: spec.md — yeyak 잔여면수) — **변경**: 실제 페이지는 HTML `X/Y` 텍스트가 아니라 캘린더 ajax가 JSON(`resultListTm[YYYYMMDD].RESVE_POSBL_CNT`/`RCRIT_NMPR_CNT`)을 반환함을 확인 (learnings.md 참조)
- **구현 대상**:
  - `lib/parsers/yeyak.ts` (JSON `resultListTm` → remaining=RESVE_POSBL_CNT, capacity=RCRIT_NMPR_CNT)
  - `lib/parsers/__fixtures__/yeyak-cal.json`
  - `lib/parsers/yeyak.test.ts`
  - `services/sources/yeyak.ts` (ajax 엔드포인트 미검증 — NOTE 참조)
- **수용 기준**:
  - [x] 날짜별 RESVE_POSBL_CNT/RCRIT_NMPR_CNT 파싱 시 remaining/capacity로 매핑 (kind='count')
  - [x] remaining=0이면 마감으로 판별 가능한 값 반환
  - [x] 해당 날짜에 운영 정보 없음(휴무)이면 kind='unavailable' (loadError 아님)
  - [x] 실패 시 loadError=true
- **검증**: `bun run test -- lib/parsers/yeyak`

---

### Task 5: 날씨 서비스 + 이모지 매핑
- **담당 시나리오**: Scenario 1·6·8 (날씨 표시 근거), 불변규칙(날씨 통일)
- **크기**: M
- **의존성**: Task 1
- **참조**: (외부: 공공데이터포털 기상청 단기예보 API 문서)
- **구현 대상**:
  - `services/weather/index.ts` (`WeatherProvider` 인터페이스)
  - `services/weather/kma.ts` (기상청 구현; 좌표→격자 변환, 예보 파싱)
  - `lib/weather/emoji.ts` (강수확률·강수량 → tier(clear/cloudy/rain/heavy) 매핑; 예보 해상도(3h/1h)→슬롯 매핑 규칙도 여기 문서화), `lib/weather/emoji.test.ts`
  - `.env.example` (`WEATHER_API_KEY=`)
- **수용 기준**:
  - [x] 강수확률 0~20%→clear(☀️), 20~50%→cloudy, 50%+→rain, 강수량 임계 초과→heavy(⛈️)로 매핑된다
  - [x] 임의 시각의 예보를 코트 좌표 기준으로 시간블록 WeatherHint로 반환한다 (mock 응답 fixture 기반)
  - [x] 날씨 서비스는 사용자 위치가 아닌 각 코트의 lat/lng를 조회 좌표로 사용한다 (불변규칙) — `getHint(lat,lng,...)` 시그니처가 코트 좌표만 받음
  - [x] tier 매핑은 소스와 무관하게 동일 함수를 사용한다 (통일 보장) — `mapWeatherTier` 단일 함수 경유
- **검증**: `bun run test -- lib/weather/emoji`

---

### Task 6: 통합 API — /api/courts (소스+날씨+거리 병합)
- **담당 시나리오**: Scenario 1·3·4 (목록·거리·반경 데이터), 14 (부분 실패 병합)
- **크기**: M
- **의존성**: Task 2,3,4,5
- **참조**: (스킬: next-best-practices — Route Handler, fetch 캐싱)
- **구현 대상**:
  - `services/aggregate.ts` (config 코트 × 선택 날짜 → 각 소스 현황 + 날씨 병합, 소스 실패는 loadError로 격리)
  - `app/api/courts/route.ts` (query: lat,lng,radius,dates → 거리계산·반경필터·거리순 정렬된 코트 배열)
  - `app/api/courts/route.test.ts` (소스/날씨 서비스 mock)
- **수용 기준**:
  - [x] lat/lng/radius/dates 요청 시 반경 내 코트만, 거리순으로 반환한다
  - [x] 한 소스가 실패해도 다른 코트는 정상 반환되고 실패 코트는 loadError로 표시된다
  - [x] 각 코트에 날짜별 현황과 날씨 tier가 포함된다 — 운영시간(06~22시) 2h 블록별 WeatherHint 배열 (gytennis·양평누리 슬롯 단위와 정렬)
- **검증**: `bun run test -- app/api/courts`

---

### Checkpoint: Tasks 4-6 이후
- [ ] 모든 테스트 통과 + 빌드 성공
- [ ] `/api/courts?lat=..&lng=..&radius=10&dates=..` 호출 시 세 소스 통합·거리순 JSON 반환 (end-to-end 데이터 파이프라인 동작)

---

### Task 7: 코트 카드 — 슬롯 소스 (시간칩+이모지·마감·코트정보·딥링크)
- **담당 시나리오**: Scenario 6 (full), 7 (지난시간 숨김), 9 (딥링크), 11 (마감), 13 (코트정보)
- **크기**: M
- **의존성**: Task 6
- **참조**: (스킬: shadcn — Card·Badge·Button·Tooltip; shadcn-guard; web-design-guidelines) / (프로젝트: `artifacts/tennis-radar/wireframe.html` 슬롯 카드)
- **구현 대상**:
  - `components/tennis/court-card.tsx`, `components/tennis/time-chip.tsx` (칩+이모지, 탭 시 %/mm 툴팁)
  - `components/tennis/court-info.tsx` (접이식), colocated `.test.tsx`
  - shadcn 설치: `badge`, `tooltip` (레지스트리 확인 후)
- **수용 기준**:
  - [x] 예약가능 시간칩이 코트 실제 단위로 렌더되고 각 칩에 강수 이모지가 표시된다
  - [x] 각 날짜 행 우측에 가능 슬롯 수 배지(예: "3슬롯")가 표시된다
  - [x] 코트 정보 영역은 기본 닫힘이고, 클릭 시 주소·면수 등이 펼쳐진다
  - [x] 칩 탭/호버 시 정확한 강수확률(%)·강수량(mm)이 툴팁으로 보인다
  - [x] 오늘 날짜·현재 15:00일 때 15:00 이전 슬롯 칩이 표시되지 않는다
  - [x] 현재시각 이후 슬롯이 없으면 "오늘 예약가능 시간대 없음"이 표시된다
  - [x] 모든 슬롯 마감이면 "예약마감"이 표시되고 예약 버튼이 비활성이다
  - [x] "예약하기" 클릭 시 `target=_blank`로 `/rsvDaily/{id}/{date}`(또는 양평누리 URL)가 열린다
  - [x] 코트 정보(주소·면수 등)가 제공 항목만 표시된다
- **검증**: `bun run test -- components/tennis/court-card`

---

### Task 8: 코트 카드 — yeyak(N면·이모지) + 로드실패 상태 통일
- **담당 시나리오**: Scenario 8 (full), 10 (딥링크), 12 (0면), 14 (로드실패)
- **크기**: M
- **의존성**: Task 7
- **참조**: (스킬: shadcn·shadcn-guard) / (wireframe yeyak 카드·상태 갤러리)
- **구현 대상**:
  - `components/tennis/court-card.tsx` (yeyak 분기: N면 + 날짜별 이모지, "예약 시간대는 사이트에서")
  - 로드실패 표현("현황 확인 불가" + 활성 외부링크, 날씨는 유지)
  - `.test.tsx` 케이스 추가
- **수용 기준**:
  - [x] yeyak 카드에 "N면 남음"과 날짜별 날씨 이모지가 (슬롯 카드와 동일 규칙으로) 표시된다
  - [x] yeyak 카드에 시간칩이 렌더되지 않고 "예약 시간대는 사이트에서 (yeyak은 날짜 단위)" 안내가 표시된다
  - [x] remaining=0이면 "예약마감"과 활성 "사이트에서 확인하기" 링크가 표시된다
  - [x] "예약하기" 클릭 시 `selectReservView.do?rsv_svc_id={id}`가 새 탭으로 열린다
  - [x] loadError 코트는 "현황 확인 불가" + 활성 외부링크를 보이고 현황 배지는 없으며 날씨는 유지된다
- **검증**: `bun run test -- components/tennis/court-card`

---

### Checkpoint: Tasks 7-8 이후
- [ ] 모든 테스트 통과 + 빌드 성공
- [ ] 세 소스 카드·마감·로드실패가 동일 레이아웃·통일 날씨규칙으로 렌더 (불변규칙 검증)
- [ ] 세 카드의 날씨 이모지가 모두 `lib/weather/emoji.ts`의 동일 함수를 경유함을 확인 (grep/import 그래프)

---

### Task 9: 위치·반경 컨트롤 + geolocation + 여의도 fallback
- **담당 시나리오**: Scenario 1 (full), 2 (full), 3 (full), 4 (full)
- **크기**: M
- **의존성**: Task 6 (API), Task 7·8 (카드로 목록 렌더)
- **참조**: (스킬: shadcn — Slider; vercel-react-best-practices — 훅) / (wireframe 컨트롤 바)
- **구현 대상**:
  - `hooks/useGeolocation.ts` (허용/거부→여의도 fallback), `hooks/useCourtFilters.ts`
  - `components/tennis/location-control.tsx`, `radius-control.tsx`, `court-list.tsx`
  - shadcn 설치: `slider`
  - colocated `.test.tsx`
- **수용 기준**:
  - [ ] 위치 허용 시 현재 위치 기준 반경 10km 코트가 거리순으로 렌더된다
  - [ ] 위치 거부 시 여의도 기준으로 렌더되고 "기본 위치(여의도)" 안내 + "현재 위치 사용하기" 버튼이 보인다
  - [ ] "현재 위치 사용하기" 클릭 시 geolocation이 재호출되고, 허용되면 실위치 기준으로 목록이 갱신된다
  - [ ] 위치 수동 변경 시 거리·목록이 재계산되고, 현재 적용 위치 레이블(예: "여의도 트윈타워")이 갱신된다
  - [ ] 반경 5km로 변경 시 밖 코트가 사라지고, 0곳이면 "반경 내 코트가 없습니다" 메시지가 표시된다
- **검증**: `bun run test -- hooks components/tennis/location-control components/tennis/radius-control`

---

### Task 10: 날짜 복수 선택 (캘린더 + 평일/주말 프리셋 + 칩)
- **담당 시나리오**: Scenario 5 (full)
- **크기**: M
- **의존성**: Task 9
- **참조**: (스킬: shadcn — Calendar(mode=multiple)·Popover·Badge) / (wireframe 날짜 셀렉터)
- **구현 대상**:
  - `components/tennis/date-selector.tsx` (+ 선택칩 ✕), `.test.tsx`
  - shadcn 설치: `calendar`, `popover`
- **수용 기준**:
  - [ ] 캘린더에서 2개 날짜 선택 시 칩 2개가 표시되고 ✕로 개별 해제된다
  - [ ] "평일" 프리셋이 조회범위 내 평일들을 선택한다
  - [ ] 날짜 선택 변경 시 각 카드가 선택 날짜별 행으로 갱신된다
  - [ ] 날짜 2개 선택 시 yeyak 카드가 날짜별 2행(날씨 이모지 + N면 남음)으로 갱신된다
- **검증**: `bun run test -- components/tennis/date-selector`

---

### Task 11: 시간대 필터 모달 (막대 1시간 다중구간) + 필터링
- **담당 시나리오**: Scenario 5-1 (full)
- **크기**: M
- **의존성**: Task 10, Task 7 (선택 구간 내 시간칩 우선 표시는 `time-chip.tsx` prop 인터페이스와 함께 확정)
- **참조**: (스킬: shadcn — Dialog) / (wireframe "시간 선택(모달)" 막대)
- **구현 대상**:
  - `components/tennis/time-filter-modal.tsx` (막대 셀 토글, 연속·불연속), `components/tennis/time-filter-button.tsx` (미니막대 썸네일)
  - `hooks/useCourtFilters.ts` (겹침 판정: 선택 구간 ∩ 코트 슬롯), `.test.tsx`
- **수용 기준**:
  - [ ] 18:00~22:00 선택 시 그 구간에 가능 슬롯 없는 슬롯 소스 코트가 목록에서 빠진다
  - [ ] 1시간제·2시간제 코트 모두 구간과 겹치면 노출된다
  - [ ] 12-14 + 18-22 불연속 선택이 가능하다 (버튼 썸네일의 시각적 반영은 E2E Task 12에서 검증)
  - [ ] yeyak 코트는 필터 적용 시 "시간 미상"으로 유지된다
  - [ ] 해제 시 전체 코트가 복원된다
- **검증**: `bun run test -- components/tennis/time-filter-modal hooks`

---

### Checkpoint: Tasks 9-11 이후
- [ ] 모든 테스트 통과 + 빌드 성공
- [ ] 위치·반경·복수날짜·시간필터가 목록에 실제 반영되는 완전 상호작용 동작

---

### Task 12: 페이지 조립 + E2E
- **담당 시나리오**: Scenario 1·4·5 통합 (happy path)
- **크기**: M
- **의존성**: Task 9,10,11
- **참조**: (스킬: next-best-practices — RSC/Client 경계; vercel-composition-patterns)
- **구현 대상**:
  - `app/page.tsx` (RSC 셸 + client island 조립)
  - `e2e/tennis-radar.spec.ts` (API는 fixture 응답으로 stub)
- **수용 기준**:
  - [ ] 앱 진입 시 (여의도 fallback) 코트 목록이 거리순으로 렌더된다
  - [ ] 반경 변경·날짜 선택·시간 필터가 목록에 반영된다
  - [ ] 예약 버튼이 새 탭 링크를 가진다
- **검증**: `bun run test:e2e -- tennis-radar`; Browser MCP — 실제 앱 이동해 목록·필터 동작 스크린샷 증거를 `artifacts/tennis-radar/evidence/task-12.png` 저장

---

## 미결정 항목
- 기상청 격자 변환(위경도→nx,ny)은 공식 LCC 변환 공식으로 구현·테스트 완료. **단, 실제 서비스키로의 실호출 검증은 아직 안 됨** — `WEATHER_API_KEY` 발급 후 `services/weather/index.ts`의 `FORECAST_URL` 응답 스키마 재확인 필요
- yeyak 캘린더 ajax 엔드포인트(`services/sources/yeyak.ts`)도 동일하게 실제 사이트 네트워크 요청으로 미검증 — 배포 전 확인 필요
- yeyak 대상 코트 rsv_svc_id 목록 및 주간/야간 분리 여부 — config 시드 시 수집·확정 (분리 안 되면 시간필터에서 "시간 미상")
- gytennis raw HTML의 available 아이콘 판별 셀렉터 — Task 2에서 실제 HTML fixture 확보 후 확정
