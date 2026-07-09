import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getWeatherEmoji } from '@/lib/weather/emoji'
import type { Slot, WeatherHint } from '@/types/tennis'

interface TimeChipProps {
  slot: Slot
  weatherHint?: WeatherHint
}

export function TimeChip({ slot, weatherHint }: TimeChipProps) {
  const label = `${slot.start.slice(0, 2)}-${slot.end.slice(0, 2)}`
  const content = (
    <Badge variant="outline">
      {label} {weatherHint ? getWeatherEmoji(weatherHint.tier) : null}
    </Badge>
  )

  if (!weatherHint) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>
        강수 {weatherHint.pop}% · {weatherHint.precip}mm
      </TooltipContent>
    </Tooltip>
  )
}
