"use client"

import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { paragraphFont } from "@/app/interface/fonts"
import { Background } from "./interface/background"
import { Generate } from "./interface/generate"
import { BottomBar } from "./interface/bottom-bar"

export function Main() {

  return (
    <div className={cn(
      `flex flex-col h-screen items-center justify-center`,
      `px-3 md:px-0`,
      paragraphFont.className
    )}>
      <Background />
      <Generate />
      <BottomBar />
      <Toaster />
    </div>
  )
}