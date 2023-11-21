import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '🌜 AI Bedtime Story 🛏️',
  description: '🌜 AI Bedtime Story 🛏️',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn(
        `h-full w-full overflow-auto`,
        inter.className
        )}>
        {children}
      </body>
    </html>
  )
}
