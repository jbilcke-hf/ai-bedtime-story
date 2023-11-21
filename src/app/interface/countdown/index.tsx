import { cn } from "@/lib/utils"

export function Countdown({
  remainingTimeInSec,
  progressPercent
}: {
  remainingTimeInSec: number,
  progressPercent: number
}) {
  return (
    <div
      className={cn(
        `z-20`,
        `fixed top-8 right-8`,
        `radial-progress text-primary-content border-4`,
        `transition-all duration-1000`,
        `bg-sky-600/30`,
        `border-sky-800/30`,
          `text-blue-100`

      )}
      style={{
        "--value": progressPercent
      } as any}
    >{
      remainingTimeInSec
    }s
    </div>
  )
}