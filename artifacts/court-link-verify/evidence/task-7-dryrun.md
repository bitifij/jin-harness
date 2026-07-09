# Task 7 dry-run — court-link-repair 스킬 절차 시연 (2026-07-10)

## 시나리오
홍은테니스장 weekday `rsv_svc_id`를 고의로 죽은 값(S999999999999999999)으로 훼손한 뒤,
스킬 절차만 따라 복구되는지 검증.

## 결과
1. **감지**: `bun run verify:courts` → 🔄 변경 감지 (소프트 404 + 검색 후보 4건), exit 1.
   나머지 17개 항목은 계속 점검되어 정상 판정 (부분 실패 격리 확인).
2. **조사**: 리포트의 대체 후보에서 "같은 요일유형 + 사용 기간이 오늘 포함" 규칙으로
   `S260623114555963304` (평일 주간 7월1일~15일) 선택.
3. **수리**: courts.ts 수정 + actions.json 작성.
4. **재검증**: `bun run verify:courts --actions ...` → 18개 전 항목 정상, exit 0.
   report.md 조치 내역에 코트·액션(fixed)·상세(old→new, 근거)·시각 기록 확인.
5. **회귀**: `bun run test` 141개 전부 통과.

절차 문서: `.claude/skills/court-link-repair/SKILL.md`
