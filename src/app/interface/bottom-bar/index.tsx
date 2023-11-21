import { cn } from "@/lib/utils"

import { About } from "../about"

export function BottomBar() {
  return (
    <div className={cn(
      `print:hidden`,
      `fixed bottom-2 md:bottom-4 left-2 right-0 md:left-3 md:right-1`,
      `flex flex-row`,
      `justify-between`,
      `pointer-events-none`
    )}>
      <div className={cn(
        `flex flex-row`,
        `items-end`,
        `pointer-events-auto`,
        `animation-all duration-300 ease-in-out`,
        `space-x-3`,
        `scale-[0.9]`
      )}>
        {/*
        <About />
      */}
      </div>
    </div>
  )
}