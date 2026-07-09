import { aggregateCourts } from '@/services/aggregate'
import { YEOUIDO_FALLBACK, DEFAULT_RADIUS_KM } from '@/config/courts'
import { toYMD } from '@/lib/date'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const lat = parseFloat(searchParams.get('lat') ?? String(YEOUIDO_FALLBACK.lat))
  const lng = parseFloat(searchParams.get('lng') ?? String(YEOUIDO_FALLBACK.lng))
  const radius = parseFloat(searchParams.get('radius') ?? String(DEFAULT_RADIUS_KM))

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
    return Response.json({ error: 'lat/lng/radius가 올바르지 않습니다' }, { status: 400 })
  }

  const datesParam = searchParams.get('dates')
  const dates = datesParam ? datesParam.split(',') : [toYMD(new Date())]

  const courts = await aggregateCourts(lat, lng, radius, dates)
  return Response.json({ courts })
}
