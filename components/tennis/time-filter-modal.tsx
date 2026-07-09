'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const HOURS = Array.from({ length: 16 }, (_, i) => 6 + i)

interface TimeFilterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedHours: number[]
  onToggleHour: (hour: number) => void
  onClear: () => void
}

export function TimeFilterModal({ open, onOpenChange, selectedHours, onToggleHour, onClear }: TimeFilterModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>가능한 시간대</DialogTitle>
        </DialogHeader>
        <div className="flex gap-0.5">
          {HOURS.map((hour) => (
            <button
              key={hour}
              type="button"
              aria-pressed={selectedHours.includes(hour)}
              aria-label={`${hour}시-${hour + 1}시`}
              onClick={() => onToggleHour(hour)}
              className={cn('h-8 flex-1 rounded-sm', selectedHours.includes(hour) ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClear}>
            전체 해제
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            적용
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
