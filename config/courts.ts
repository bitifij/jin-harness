import type { Court } from '@/types/tennis'

export const YEOUIDO_FALLBACK = { lat: 37.5219, lng: 126.9245 }
export const DEFAULT_RADIUS_KM = 10

const GYTENNIS = 'https://gytennis.or.kr'
const YEYAK = 'https://yeyak.seoul.go.kr/web/reservation/selectReservView.do'

// NOTE: gytennis court IDs and coordinates are seed values — verify against actual site.
export const courts: Court[] = [
  // ──── gytennis (고양특례시테니스협회) ────
  // 코트명·ID: gytennis.or.kr 내비게이션에서 확인 (2026-07-09)
  // 좌표: 근사값 — 실측 필요
  {
    id: 'gytennis-1',
    name: '대화코트',
    source: 'gytennis',
    lat: 37.6617,
    lng: 126.7766,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/1/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 일산서구 대화동',
      courtCount: 4,
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-2',
    name: '삼송유수지코트',
    source: 'gytennis',
    lat: 37.6491,
    lng: 126.8762,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/2/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 덕양구 삼송동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-3',
    name: '성라코트',
    source: 'gytennis',
    lat: 37.6850,
    lng: 126.8289,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/3/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 일산동구 성석동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-4',
    name: '성사전천후코트',
    source: 'gytennis',
    lat: 37.6420,
    lng: 126.8680,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/4/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 덕양구 성사동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-5',
    name: '성사실외코트',
    source: 'gytennis',
    lat: 37.6418,
    lng: 126.8683,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/5/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 덕양구 성사동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-6',
    name: '중산코트',
    source: 'gytennis',
    lat: 37.6720,
    lng: 126.7920,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/6/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 일산서구 중산동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-7',
    name: '충장코트',
    source: 'gytennis',
    lat: 37.6220,
    lng: 126.8580,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/7/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 덕양구 충장동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-8',
    name: '킨텍스유수지코트',
    source: 'gytennis',
    lat: 37.6655,
    lng: 126.7614,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/8/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 일산서구 대화동 (킨텍스 인근)',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-9',
    name: '토당코트',
    source: 'gytennis',
    lat: 37.6380,
    lng: 126.8450,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/9/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 덕양구 토당동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },
  {
    id: 'gytennis-10',
    name: '화정코트',
    source: 'gytennis',
    lat: 37.6365,
    lng: 126.8315,
    deepLinkTemplate: `${GYTENNIS}/rsvDaily/10/{date}`,
    slotUnitMinutes: 120,
    info: {
      address: '경기도 고양시 덕양구 화정동',
      surface: '하드',
      hours: '06:00~22:00',
    },
  },

  // ──── 양평누리 (영등포시설공단) ────
  {
    id: 'yangpyeong-1',
    name: '양평누리 테니스장',
    source: 'yangpyeong',
    lat: 37.5244,
    lng: 126.8973,
    deepLinkTemplate: 'https://srent.y-sisul.or.kr/rentalSvc/svc/selectSvcReservationCalenderView.do',
    slotUnitMinutes: 120,
    info: {
      address: '서울특별시 영등포구 양평동4가 29-5',
      courtCount: 2,
      surface: '하드',
      hours: '06:00~22:00',
      phone: '02-2630-2900',
    },
  },

  // ──── yeyak (서울시 공공예약서비스) ────
  // NOTE: rsv_svc_id 값은 실제 사이트에서 확인 필요
  {
    id: 'yeyak-ddukseom',
    name: '뚝섬한강공원 테니스장',
    source: 'yeyak',
    lat: 37.5308,
    lng: 127.0704,
    deepLinkTemplate: `${YEYAK}?rsv_svc_id=S230927141830`,
    slotUnitMinutes: 60,
    info: {
      address: '서울특별시 광진구 자양동 724',
      courtCount: 8,
      surface: '하드',
    },
  },
  {
    id: 'yeyak-banpo',
    name: '반포한강공원 테니스장',
    source: 'yeyak',
    lat: 37.5077,
    lng: 126.9998,
    deepLinkTemplate: `${YEYAK}?rsv_svc_id=S220101000001`,
    slotUnitMinutes: 60,
    info: {
      address: '서울특별시 서초구 반포동 724',
      courtCount: 6,
      surface: '하드',
    },
  },
  {
    id: 'yeyak-mangwon',
    name: '망원한강공원 테니스장',
    source: 'yeyak',
    lat: 37.5546,
    lng: 126.8976,
    deepLinkTemplate: `${YEYAK}?rsv_svc_id=S220101000002`,
    slotUnitMinutes: 60,
    info: {
      address: '서울특별시 마포구 망원동',
      courtCount: 4,
      surface: '하드',
    },
  },
]
