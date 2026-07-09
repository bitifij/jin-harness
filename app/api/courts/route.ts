import { aggregateCourts } from '@/services/aggregate'
import { YEOUIDO_FALLBACK, DEFAULT_RADIUS_KM } from '@/config/courts'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const lat = parseFloat(searchParams.get('lat') ?? String(YEOUIDO_FALLBACK.lat))
  const lng = parseFloat(searchParams.get('lng') ?? String(YEOUIDO_FALLBACK.lng))
  const radius = parseFloat(searchParams.get('radius') ?? String(DEFAULT_RADIUS_KM))
  const datesParam = searchParams.get('dates')
  const dates = datesParam ? datesParam.split(',') : [new Date().toISOString().slice(0, 10)]

  const courts = await aggregateCourts(lat, lng, radius, dates)
  return Response.json({ courts })
}
