---
name: court-link-repair
description: tennis-radar 코트 예약 링크가 깨졌을 때의 조사·수리·보고 절차. `bun run verify:courts`가 broken/changed를 보고했을 때, 매일 점검 루틴에서, 또는 사용자가 "예약 링크가 깨졌다"고 제보할 때 트리거한다. 검증 전부 통과 상태에서는 쓰지 않는다.
---

# Court Link Repair

외부 예약 사이트 3곳(gytennis, 양평누리, yeyak)의 링크·ID가 깨졌을 때 조사해서 고치고, 못 고치면 숨기고, 반드시 리포트에 기록하는 절차.

## 불변 규칙 (위반 금지)

1. **재검증 없는 커밋 금지** — 수정한 값이 `bun run verify:courts`를 통과하는 것을 확인한 뒤에만 커밋한다.
2. **코트 데이터 삭제 금지** — 수리 불가 코트는 `hidden: true` + `hiddenReason`으로 숨기기만 한다. 최종 삭제는 사람이 결정한다.
3. **조치는 반드시 리포트에 남긴다** — 무엇을(old→new) 왜(근거) 어떻게(조사 방법) 바꿨는지. 커밋 내역과 리포트가 일치해야 한다.
4. **오판 주의** — gytennis는 Node/Bun fetch가 TLS 문제로 실패하지만 사이트는 정상이다 (검증은 curl 사용). yeyak 캘린더 ajax는 WAF가 비브라우저 접근을 차단한다 — 이 둘은 "깨짐"이 아니다.

## 절차

### 1. 현황 파악

```bash
bun run verify:courts
```

리포트(`artifacts/court-link-verify/report.md`)에서 ❌ broken / 🔄 changed 항목을 확인한다.

### 2. 항목별 조사

**🔄 changed (대체 후보 있음)** — yeyak 회차 로테이션. `rsv_svc_id`는 코트·요일유형별 회차 단위로 **월(홍은은 보름)마다 새로 발급**되므로 이는 정기적으로 발생하는 정상 이벤트다.
- 리포트의 대체 후보에서 같은 코트 번호·같은 요일유형(평일/주말·공휴일, '저녁' 회차는 제외)·사용 기간이 현재를 포함하는 회차를 고른다.
- 후보 페이지를 직접 열어 확인: `curl -s 'https://yeyak.seoul.go.kr/web/reservation/selectReservView.do?rsv_svc_id=<후보ID>' | grep <시설명>`

**❌ broken (후보 없음)** — 원인별 조사:
- **yeyak**: 검색 ajax를 직접 호출해 재확인 (JS 렌더링이라고 headless 브라우저부터 꺼내지 말 것 — 폼 뒤엔 평범한 POST가 있다):
  ```bash
  curl -s -X POST 'https://yeyak.seoul.go.kr/web/search/selectPageListSvcMoreAjax.do' \
    --data-urlencode 'sch_text=<검색키워드>' --data-urlencode 'currentPage=<1..N>'
  ```
  페이지를 늘려가며 끝까지 확인한다 (광나루는 4~7페이지에 있었다). `MUMM_CL_NM == '테니스장'`만 필터.
- **gytennis / 양평누리**: 사이트 홈페이지에서 실제 내비게이션 경로를 따라가 현재 URL 구조를 확인한다. 정적 HTML 안의 폼 action과 onclick 핸들러를 따라가면 대부분 curl로 재현 가능하다.
- 검색·탐색으로도 시설이 안 나오면 → **수리 불가** (4번으로).

### 3. 수리 (대체값을 찾은 경우)

1. `config/courts.ts`의 해당 `bookingLinks` 항목을 수정한다: `urlTemplate`의 ID와 `expectedText`(회차명 기준, 날짜 부분 제외)를 함께 갱신.
2. **주의**: 링크 URL 형식 자체가 바뀌면 `services/aggregate.ts`의 ID 추출 로직(정규식·URL 파싱)도 같이 확인한다 — 딥링크 문자열에서 ID를 뽑아 쓰는 코드는 암묵적으로 결합돼 있다.
3. 조치 기록 파일 작성 (`artifacts/court-link-verify/actions.json`):
   ```json
   [{ "courtId": "yeyak-hongeun", "action": "fixed",
      "detail": "weekday rsv_svc_id S...304 → S...728 (7/16~31 회차 로테이션, 검색 ajax로 확인)",
      "timestamp": "2026-07-16 09:05 (KST)" }]
   ```
4. 재검증 + 리포트 갱신: `bun run verify:courts --actions artifacts/court-link-verify/actions.json`
   - **전 항목 통과가 확인될 때까지 커밋하지 않는다.**
5. `bun run test`로 회귀 확인.

### 4. 숨김 (수리 불가)

1. `config/courts.ts`에서 해당 코트에 `hidden: true`, `hiddenReason: '<사유 + 날짜>'`를 추가한다 (데이터는 그대로 둔다).
2. 조치 기록 파일에 `"action": "hidden"`으로 사유·시각을 기록한다.
3. `bun run verify:courts --actions ...`로 리포트를 갱신한다 — 숨긴 코트는 "점검 제외"로 옮겨지고 조치 내역에 남는지 확인.
4. `bun run test`로 회귀 확인.

### 5. 커밋

1. `actions.json`은 리포트에 반영이 끝났으면 삭제한다 (일회성 전달용 — 이력은 리포트와 git이 보존).
2. 수정과 리포트를 **함께** 하나의 커밋으로: `fix(tennis-radar): <코트> <무엇을> 교체/숨김 — <사유>`
3. main에 push한다.

### 6. 반복 함정 (learnings 요약)

- 소프트 404: yeyak은 죽은 ID도 HTTP 200 + "페이지를 찾을 수 없습니다" 페이지를 준다 — 상태 코드만 믿지 말 것.
- 요일유형: 같은 코트라도 평일/주말·공휴일 ID가 다르다. 반대 유형 ID로 바꿔치우면 검증은 통과해도 사용자가 엉뚱한 회차로 간다 — `expectedText`가 요일유형까지 담고 있는지 확인.
- "제약"으로 보이는 것이 사실 기능일 수 있다 — 페이지 HTML을 한 번 더 훑어 이전/다음 링크, 파라미터를 확인.
