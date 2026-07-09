# Tennis Radar — Learnings

## Task 순서
Task 1(도메인) → 2,3,4(소스 파서, 독립) → 5(날씨, Task1에만 의존) → 6(통합 API, 2·3·4·5 의존) → 7(카드 UI, 6 의존) → 8~12(남음).
plan.md의 순서를 그대로 따름 — 재정렬 불필요.

## 판단 (applied: not-yet 메모)

- **yeyak 데이터 형식 변경**: plan.md는 spec 초안 기준 HTML `X/Y` 텍스트를 가정했으나, 실제 조사(이전 세션 fixture: `yeyak-cal.json`)에서 캘린더 ajax가 JSON(`resultListTm[YYYYMMDD].RESVE_POSBL_CNT`/`RCRIT_NMPR_CNT`)을 반환함을 확인. 파서를 JSON 파싱으로 구현하고 plan.md 수용 기준을 실제 값으로 갱신함. **재발 가능성**: 외부 사이트 파싱 작업 시 "가정된 포맷"과 "실제 응답"이 다를 수 있다는 일반 원칙 — 다음 feature에서 외부 스크레이핑 시 파서 구현 전 실제 응답 샘플 확보를 우선하면 좋을 신호.
- **미검증 외부 엔드포인트 2곳**: `services/sources/yeyak.ts`의 캘린더 ajax URL, `services/weather/index.ts`의 기상청 실호출 스키마 — 둘 다 네트워크 접근 없이 구현했고 NOTE 주석으로 표시. 배포 전 실제 호출로 검증 필요 (plan.md 미결정 항목에 기록).
- **날씨 해상도 설계**: 코트 운영시간(06~22시)을 2h 블록 8개로 나눠 날씨를 조회 — gytennis/양평누리의 2h 슬롯 단위와 정확히 정렬됨. yeyak(1h 단위)은 시간칩을 안 쓰므로 문제 없음. 향후 1h 슬롯 코트가 추가되면 블록 세분화 필요.
- **jsdom ResizeObserver 누락**: Radix Popper 계열(Tooltip/Popover/Select 등) 컴포넌트를 jsdom에서 렌더링하면 `ResizeObserver is not defined`로 실패. `vitest.setup.ts`에 전역 폴리필 추가로 해결 — **일반화 가능, 재발 가능성 높음**: 이후 Popover/Select 등 다른 shadcn 오버레이 컴포넌트 테스트 작성 시 이미 해결되어 있음.

## 다음 세션 재시작
- Task 8 (yeyak 카드 + 로드실패 통일)부터 `/execute-plan tennis-radar`로 재개
- 완료: Task 1~7 (커밋 완료, `bun run test`/`bun run build` 모두 통과)
