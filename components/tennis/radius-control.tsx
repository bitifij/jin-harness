import { Slider } from '@/components/ui/slider'

interface RadiusControlProps {
  radius: number
  onRadiusChange: (radius: number) => void
}

export function RadiusControl({ radius, onRadiusChange }: RadiusControlProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">반경</span>
      <Slider
        aria-label="반경(km)"
        min={5}
        max={20}
        step={5}
        value={[radius]}
        onValueChange={(values) => onRadiusChange(values[0])}
        className="w-24"
      />
      <span className="font-bold">{radius}km</span>
    </div>
  )
}
