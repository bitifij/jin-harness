# Tennis Radar — Learnings

## Task 순서
Task 1(도메인) → 2,3,4(소스 파서, 독립) → 5(날씨, Task1에만 의존) → 6(통합 API, 2·3·4·5 의존) → 7(카드 UI, 6 의존) → 8~12(남음).
plan.md의 순서를 그대로 따름 — 재정렬 불필요.

## 판단 (applied: not-yet 메모)

- **yeyak 데이터 형식 변경**: plan.md는 spec 초안 기준 HTML `X/Y` 텍스트를 가정했으나, 실제 조사(이전 세션 fixture: `yeyak-cal.json`)에서 캘린더 ajax가 JSON(`resultListTm[YYYYMMDD].RESVE_POSBL_CNT`/`RCRIT_NMPR_CNT`)을 반환함을 확인. 파서를 JSON 파싱으로 구현하고 plan.md 수용 기준을 실제 값으로 갱신함. **재발 가능성**: 외부 사이트 파싱 작업 시 "가정된 포맷"과 "실제 응답"이 다를 수 있다는 일반 원칙 — 다음 feature에서 외부 스크레이핑 시 파서 구현 전 실제 응답 샘플 확보를 우선하면 좋을 신호.
- **미검증 외부 엔드포인트 2곳**: `services/sources/yeyak.ts`의 캘린더 ajax URL, `services/weather/index.ts`의 기상청 실호출 스키마 — 둘 다 네트워크 접근 없이 구현했고 NOTE 주석으로 표시. 배포 전 실제 호출로 검증 필요 (plan.md 미결정 항목에 기록).
- **날씨 해상도 설계**: 코트 운영시간(06~22시)을 2h 블록 8개로 나눠 날씨를 조회 — gytennis/양평누리의 2h 슬롯 단위와 정확히 정렬됨. yeyak(1h 단위)은 시간칩을 안 쓰므로 문제 없음. 향후 1h 슬롯 코트가 추가되면 블록 세분화 필요.
- **jsdom ResizeObserver 누락**: Radix Popper 계열(Tooltip/Popover/Select 등) 컴포넌트를 jsdom에서 렌더링하면 `ResizeObserver is not defined`로 실패. `vitest.setup.ts`에 전역 폴리필 추가로 해결 — **일반화 가능, 재발 가능성 높음**: 이후 Popover/Select 등 다른 shadcn 오버레이 컴포넌트 테스트 작성 시 이미 해결되어 있음.

## Task 12 — 페이지 조립 + E2E

- **완료**: Task 1~12 전체 커밋 완료 (`bun run test` 103/103, `bun run build`, `bun run test:e2e -- tennis-radar` 4/4 모두 통과). Browser MCP 대신 로컬 Playwright(headless chromium)로 스크린샷 증거 확보 — `artifacts/tennis-radar/evidence/task-12.png`.
- **Playwright Clock API — `.install()` 대신 `.setFixedTime()`을 써야 함**: 오늘 날짜 카드는 "현재 시각 이전 슬롯 숨김" 로직(`court-card.tsx`)이 있어 e2e 실행 시각에 따라 결과가 달라지는 flakiness가 있었다. `page.clock.install({ time })`으로 고정하려 하니 Radix Dialog(TimeFilterModal)가 아예 열리지 않는 현상 발생 — `install()`은 `setTimeout` 등 타이머까지 페이크하여 Radix의 내부 애니메이션/포털 타이밍 로직을 깨뜨린다. `page.clock.setFixedTime(date)`(Date만 고정, 타이머는 실시간 유지)로 교체하니 정상 동작. **재발 가능성 높음, 일반화 가능**: "오늘"·"지금" 상대 로직을 검증하는 모든 향후 e2e 테스트에서 동일하게 걸릴 수 있음.
- **judgment**: code-reviewer가 지적한 Important 4건(쿼리 파라미터 미검증→NaN 전파, tennis-radar 최상위 fetch에 `.catch()` 누락, yangpyeong 파서의 월 오매칭, 날씨 서비스 8배 중복 fetch)을 모두 직접 수정. 특히 yangpyeong 픽스처를 다시 읽다가 이전/다음달 링크(`sch_sym=YYYY-MM`)와 월 헤더(`.calendar1_yearmonth strong`)를 발견해, "현재 월만 조회 가능"이라는 기존 가정(Task 3 당시 기록)이 실제로는 틀렸음을 확인 — 파라미터로 정확한 월을 요청하고 렌더된 월을 검증하는 fail-closed 방식으로 수정. **재발 가능성**: 외부 사이트 파싱 시 초기에 "제약"으로 기록한 것이 실은 페이지에 이미 있는 기능을 못 찾은 것일 수 있다는 신호 — fixture HTML을 한 번 더 훑어보는 습관이 유용함.
- **판단**: spec.md Scenario 5-1의 "선택 구간 내 시간대 칩을 우선 표시"(시각적 하이라이트)는 Task 11 plan.md 수용 기준에 애초에 없었고(필터링 자체는 동작) 이번에도 범위에 넣지 않음 — code-reviewer도 Critical/Important로 보지 않음. 향후 별도 요청 시 `time-chip.tsx`에 `highlighted?: boolean` prop 추가로 구현 가능.
- **판단**: 날씨 서비스 중복 fetch(코트당 8회→1회 dedupe)는 Important로 분류해 직접 수정. 실제 KMA 엔드포인트는 여전히 미검증 상태이지만, 이 수정은 fetch 자체를 nx/ny/날짜 단위로 캐싱하는 순수 리팩터라 실제 API 응답 포맷과 무관하게 안전하게 적용 가능했음.

## 배포 후 발견 — 딥링크 사각지대

- **gytennis TLS 이슈**(실제 앱 실행 중 발견) + **딥링크 3종 오류**(사용자 제보로 발견): 둘 다 "파서가 데이터를 잘 가져오는가"만 fixture로 검증했고, **"사용자가 실제로 클릭하는 링크(deepLinkTemplate)가 진짜 살아있는 URL인가"는 한 번도 검증 안 함**. gytennis·양평누리는 아예 존재하지 않는 경로였고(로그인 리다이렉트/404), yeyak은 `rsv_svc_id`가 가짜 값이라 소프트 404. 세 소스 다 동일한 사각지대에 걸림.
- **일반화 가능, 재발 가능성 높음**: 외부 사이트를 스크레이핑+딥링크 두 가지 용도로 쓸 때, "데이터 조회 URL"과 "사용자가 클릭해서 이동할 URL"은 별개로 각각 실제 접속해서 검증해야 한다 — 하나가 맞다고 다른 하나도 맞다는 보장이 없다(실제로 이번에 셋 다 데이터 조회는 되는데 딥링크만 틀렸었음). 다음 feature에서 외부 서비스로 나가는 링크(딥링크·CTA 버튼 href 등)를 만들 때는 Task 완료 기준에 "실제 URL로 curl/브라우저 접속 확인"을 명시적으로 넣는 게 좋겠음.
- **판단**: gytennis(`/rsvDaily/`→`/daily/`)와 양평누리(404 URL → `s04.od.list.asp`)는 실제 사이트 홈페이지 링크로 정답을 바로 확인할 수 있어서 직접 수정. gytennis는 `services/aggregate.ts`의 `extractGytennisCourtId` 정규식도 딥링크 형식 변경에 맞춰 같이 고쳐야 했음 — 딥링크 문자열에서 ID를 정규식으로 뽑아 쓰는 코드가 있다면 두 값이 암묵적으로 결합돼 있다는 뜻이니 형식 변경 시 항상 같이 확인.
- **판단**: yeyak `rsv_svc_id`는 사이트가 검색을 JS로 렌더링해서 `curl`로 못 찾음 — 브라우저 조작이 필요해 이번엔 미루고 plan.md 미결정 항목에 기록만 함 (사용자 확인 대기).
