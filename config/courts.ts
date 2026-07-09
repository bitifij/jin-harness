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
    deepLinkTemplate: `${GYTENNIS}/daily/1/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/2/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/3/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/4/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/5/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/6/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/7/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/8/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/9/{date}`,
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
    deepLinkTemplate: `${GYTENNIS}/daily/10/{date}`,
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
    deepLinkTemplate: 'https://srent.y-sisul.or.kr/page/rent/s04.od.list.asp',
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
  // NOTE: 뚝섬한강공원·반포한강공원은 yeyak 검색(sch_text=뚝섬/반포)에 테니스장 자체가
  // 조회되지 않음 — 애초에 yeyak에 등록된 시설이 아닌 것으로 보여 실제 검색 결과로 교체함
  // (2026-07-09, /web/search/selectPageListSvcMoreAjax.do 직접 호출로 확인)
  {
    id: 'yeyak-jamwon',
    name: '잠원한강공원 테니스장',
    source: 'yeyak',
    lat: 37.52075,
    lng: 127.01228,
    deepLinkTemplate: `${YEYAK}?rsv_svc_id=S260628141718667194`,
    slotUnitMinutes: 60,
    info: {
      address: '서울특별시 서초구 잠원로 221',
      surface: '하드',
    },
  },
  {
    id: 'yeyak-gwangnaru',
    name: '광나루한강공원 테니스장',
    source: 'yeyak',
    lat: 37.54989784603126,
    lng: 127.12188006433978,
    deepLinkTemplate: `${YEYAK}?rsv_svc_id=S260629124826190439`,
    slotUnitMinutes: 60,
    info: {
      address: '서울특별시 강동구 암사동 637',
      surface: '하드',
    },
  },
  {
    // 실제 사이트에서 검증된 값 (2026-07-09, 사용자 확인) — 망원한강공원(가짜 rsv_svc_id) 대체
    // 좌표는 페이지 내 주석 처리된 legacy 스크립트에서 추출한 근사값 — 실측 필요
    id: 'yeyak-hongeun',
    name: '홍은테니스장',
    source: 'yeyak',
    lat: 37.59699,
    lng: 126.94042,
    deepLinkTemplate: `${YEYAK}?rsv_svc_id=S260623114555963304`,
    slotUnitMinutes: 60,
    info: {
      address: '서울특별시 서대문구 홍은동',
      surface: '하드',
    },
  },
]
