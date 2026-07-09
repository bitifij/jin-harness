import { expect, test } from "@playwright/test";

const TODAY = new Date().toISOString().slice(0, 10);

const COURT_NEAR = {
  id: "gytennis-1",
  name: "대화코트",
  source: "gytennis",
  lat: 37.6617,
  lng: 126.7766,
  deepLinkTemplate: "https://gytennis.or.kr/rsvDaily/1/{date}",
  slotUnitMinutes: 120,
  info: { address: "경기도 고양시 일산서구 대화동" },
  distanceKm: 3.2,
  availability: {
    [TODAY]: {
      date: TODAY,
      kind: "slot",
      slots: [{ start: "08:00", end: "10:00", available: true }],
    },
  },
  weather: {
    [TODAY]: [{ hourFrom: 8, hourTo: 10, tier: "clear", pop: 10, precip: 0 }],
  },
};

const COURT_FAR = {
  id: "yangpyeong-1",
  name: "양평누리 테니스장",
  source: "yangpyeong",
  lat: 37.5244,
  lng: 126.8973,
  deepLinkTemplate: "https://srent.y-sisul.or.kr/rentalSvc/svc/selectSvcReservationCalenderView.do",
  slotUnitMinutes: 120,
  info: { address: "서울특별시 영등포구 양평동4가 29-5" },
  distanceKm: 8.5,
  availability: {
    [TODAY]: {
      date: TODAY,
      kind: "slot",
      slots: [{ start: "14:00", end: "16:00", available: true }],
    },
  },
  weather: {
    [TODAY]: [{ hourFrom: 14, hourTo: 16, tier: "cloudy", pop: 30, precip: 0 }],
  },
};

test.beforeEach(async ({ page }) => {
  // 슬롯 시간대(08~10시, 14~16시)가 오늘자 카드에서 항상 노출되도록 브라우저 시각을 자정으로 고정한다.
  // (CourtCard는 오늘 날짜일 때 현재 시각 이전 슬롯을 숨기므로, 실제 실행 시각에 좌우되면 안 된다)
  await page.clock.setFixedTime(new Date(`${TODAY}T00:00:00`));
  await page.route("**/api/courts**", async (route) => {
    const url = new URL(route.request().url());
    const radius = Number(url.searchParams.get("radius") ?? "10");
    const courts = [COURT_NEAR, COURT_FAR].filter((c) => c.distanceKm <= radius);
    await route.fulfill({ json: { courts } });
  });
});

test("진입 시 여의도 기본 위치 기준 거리순으로 코트 목록이 렌더된다", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("court-card-gytennis-1")).toBeVisible();
  await expect(page.getByTestId("court-card-yangpyeong-1")).toBeVisible();
  await expect(page.getByText("기본 위치(여의도) 사용 중")).toBeVisible();

  const order = await page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-testid^='court-card-']")).map((el) =>
      el.getAttribute("data-testid"),
    ),
  );
  expect(order).toEqual(["court-card-gytennis-1", "court-card-yangpyeong-1"]);
});

test("반경을 5km로 줄이면 반경 밖 코트가 목록에서 사라진다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("court-card-yangpyeong-1")).toBeVisible();

  const slider = page.getByRole("slider");
  await slider.focus();
  await slider.press("ArrowLeft");

  await expect(page.getByTestId("court-card-yangpyeong-1")).toBeHidden();
  await expect(page.getByTestId("court-card-gytennis-1")).toBeVisible();
});

test("시간 필터 적용 시 겹치지 않는 코트가 목록에서 제외된다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("court-card-yangpyeong-1")).toBeVisible();

  await page.getByRole("button", { name: /^시간/ }).click();
  await page.getByRole("button", { name: "8시-9시" }).click();
  await page.getByRole("button", { name: "적용" }).click();

  await expect(page.getByTestId("court-card-yangpyeong-1")).toBeHidden();
  await expect(page.getByTestId("court-card-gytennis-1")).toBeVisible();
});

test("예약 버튼이 새 탭(target=_blank)으로 코트 딥링크를 가리킨다", async ({ page }) => {
  await page.goto("/");
  const card = page.getByTestId("court-card-gytennis-1");
  await expect(card).toBeVisible();

  const link = card.getByRole("link", { name: "예약하기" });
  await expect(link).toHaveAttribute("href", `https://gytennis.or.kr/rsvDaily/1/${TODAY}`);
  await expect(link).toHaveAttribute("target", "_blank");
});
