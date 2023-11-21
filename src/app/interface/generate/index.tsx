"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useSpring, animated } from "@react-spring/web"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { split } from "sentence-splitter"

import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { headingFont } from "@/app/interface/fonts"
import { useCharacterLimit } from "@/lib/useCharacterLimit"
import { generateStoryLines } from "@/app/server/actions/generateStoryLines"
import { Story, StoryLine, TTSVoice } from "@/types"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { useCountdown } from "@/lib/useCountdown"
import { useAudio } from "@/lib/useAudio"

import { Countdown } from "../countdown"

type Stage = "generate" | "finished"

export function Generate() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsEntries = searchParams ? Array.from(searchParams.entries()) : []
  const [_isPending, startTransition] = useTransition()

  const scrollRef = useRef<HTMLDivElement>(null)

  const [isLocked, setLocked] = useState(false)
  const [promptDraft, setPromptDraft] = useState("")
  const [assetUrl, setAssetUrl] = useState("")
  const [isOverSubmitButton, setOverSubmitButton] = useState(false)

  const [runs, setRuns] = useState(0)
  const runsRef = useRef(0)

  const currentLineIndexRef = useRef(0)
  const [currentLineIndex, setCurrentLineIndex] = useState(0)

  useEffect(() => {
    currentLineIndexRef.current = currentLineIndex
  }, [currentLineIndex])
  
  const [storyLines, setStoryLines] = useState<StoryLine[]>([])

  // computing those is cheap
  const wholeStory = storyLines.map(line => line.text).join("\n")
  const currentLine = storyLines.at(currentLineIndex)
  const currentLineText = currentLine?.text || ""
  const currentLineAudio = currentLine?.audio || ""

  // reset the whole player when story changes
  useEffect(() => {
    setCurrentLineIndex(0)
  }, [wholeStory])

  const [stage, setStage] = useState<Stage>("generate")
  
  const { toast } = useToast()

  const audio = useAudio()

  /*
  // to simulate a "typing" effect
  however.. we don't need this as we already have an audio player!

  const [typedStoryText, setTypedStoryText] = useState("")
  const [typedStoryCharacterIndex, setTypedStoryCharacterIndex] = useState(0)

  useEffect(() => {
    if (storyText && typedStoryCharacterIndex < storyText.length) {
      setTimeout(() => {
        setTypedStoryText(typedStoryText + story.text[typedStoryCharacterIndex])
        setTypedStoryCharacterIndex(typedStoryCharacterIndex + 1)
        console.log("boom")
      }, 40)
    }
  }, [storyText, typedStoryCharacterIndex])
  */
  
  const { progressPercent, remainingTimeInSec } = useCountdown({
    isActive: isLocked,
    timerId: runs, // everytime we change this, the timer will reset
    durationInSec: /*stage === "interpolate" ? 30 :*/ 35, // it usually takes 40 seconds, but there might be lag
    onEnd: () => {}
  })
  
  const { shouldWarn, colorClass, nbCharsUsed, nbCharsLimits } = useCharacterLimit({
    value: promptDraft,
    nbCharsLimits: 70,
    warnBelow: 10,
  })

  const submitButtonBouncer = useSpring({
    transform: isOverSubmitButton
      ? 'scale(1.05)'
      : 'scale(1.0)',
    boxShadow: isOverSubmitButton 
      ? `0px 5px 15px 0px rgba(0, 0, 0, 0.05)`
      : `0px 0px 0px 0px rgba(0, 0, 0, 0.05)`,
    loop: true,
    config: {
      tension: 300,
      friction: 10,
    },
  })

  const handleSubmit = () => {
    if (isLocked) { return }
    if (!promptDraft) { return }

    setRuns(runsRef.current + 1)
    setLocked(true)
    setStage("generate")

    scrollRef.current?.scroll({
      top: 0,
      behavior: 'smooth'
    })

    startTransition(async () => {

      // now you got a read/write object
      const current = new URLSearchParams(searchParamsEntries)
      current.set("prompt", promptDraft)
      const search = current.toString()
      router.push(`${pathname}${search ? `?${search}` : ""}`)

      const voice: TTSVoice = "Cloée"
      
      setRuns(runsRef.current + 1)

      try {
        // console.log("starting transition, calling generateAnimation")
        const newStoryLines = await generateStoryLines(promptDraft, voice)

        console.log(`generated ${newStoryLines.length} story lines`)

        setStoryLines(newStoryLines)

      } catch (err) {

        toast({
          title: "We couldn't generate your story 👀",
          description: "We are probably over capacity, but you can try again 🤗",
        })
    
        console.log("generation failed! probably just a Gradio failure, so let's just run the round robin again!")
      
        return
      } finally {
        setLocked(false)
        setStage("finished")
      }
    })
  }

  /*
  This is where we could download existing bedtime stories

  useEffect(() => {
    startTransition(async () => {
      const posts = await getLatestPosts({
        maxNbPosts: 32,
        shuffle: true,
      })
      if (posts?.length) {
        setCommunityRoll(posts)
      }
    })
  }, [])

  */

  const handleClickPlay = () => {
    console.log("let's play the story! but it could also be automatic")
  }


  useEffect(() => {
    const fn = async () => {
      if (!currentLineAudio) {
        return
      }
      console.log("story audio changed!")

      try {
        console.log("playing audio!")
        await audio(currentLineAudio) // play
        console.log("audio has ended, I think? let's go next!")
        setCurrentLineIndex(currentLineIndexRef.current += 1)
        // TODO change the line
      } catch (err) {
        console.error(err)
      }
    }
    fn()

    return () => {
      audio() // stop
    }
  }, [currentLineAudio])

  return (
    <div
      ref={scrollRef}
      className={cn(
      `fixed inset-0 w-screen h-screen`,
      `flex flex-col items-center justify-center`,
      // `transition-all duration-300 ease-in-out`,
      `overflow-y-scroll`,
       )}>
      <TooltipProvider>
      {isLocked ? <Countdown
        progressPercent={progressPercent}
        remainingTimeInSec={remainingTimeInSec}
      /> : null}
      <div
        className={cn(
        `flex flex-col`,
        `w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh]`,
        `space-y-8`,
       //  `transition-all duration-300 ease-in-out`,
      )}>
      
        <div
          className={cn(
            `flex flex-col`,
            `flex-grow`,
            // `rounded-2xl md:rounded-3xl`,
            // `backdrop-blur-md bg-gray-800/30`,
            // `border-2 border-white/10`,
            `items-center`,
            `space-y-6 md:space-y-8 lg:space-y-12 xl:space-y-14`,
            `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-14`,

          )}>
            {assetUrl ? <div
              className={cn(
                `flex flex-col`,
                `space-y-3 md:space-y-6`,
                `items-center`,
              )}>
                {assetUrl && <img
                  src={assetUrl}
                  className={cn(
                    `w-[512px] object-cover`,
                    `rounded-2xl`
                    )}
                />}
            </div> : null}

            <div className={cn(
              `flex flex-col md:flex-row`,
              `space-y-3 md:space-y-0 md:space-x-3`,
              ` w-full md:max-w-[1024px]`,
              `items-center justify-between`
            )}>
              <div className={cn(
                `flex flex-row flex-grow w-full`
              )}>
                <input
                  type="text"
                  placeholder={`Describe your story in a few words`}
                  className={cn(
                    headingFont.className,
                    `w-full`,
                    `input input-bordered rounded-full`,
                    `transition-all duration-300 ease-in-out`,
                     `backdrop-blur-md `,
                    `placeholder:text-gray-400`,
                    `disabled:bg-gray-500 disabled:text-yellow-300 disabled:border-transparent`,
                    isLocked
                      ? `bg-white/10 text-yellow-400/60 selection:bg-yellow-200/60  selection:text-yellow-200/60 border-transparent`
                      : `bg-white/10 text-yellow-400/100 selection:bg-yellow-200/100 selection:text-yellow-200/100`,
                    `text-left`,
                    `text-2xl leading-10 px-6 h-16 pt-1`,
                  )}
                  value={promptDraft}
                  onChange={e => setPromptDraft(e.target.value)}
                  onKeyDown={({ key }) => {
                    if (key === 'Enter') {
                     if (!isLocked) {
                        handleSubmit()
                     }
                    }
                  }}
                  disabled={isLocked}
                />
                <div className={cn(
                  `flex flew-row ml-[-64px] items-center`,
                  `transition-all duration-300 ease-in-out`,
                  `text-base`,
                  // `bg-yellow-200`,
                  `rounded-full`,
                  `text-right`,
                  `p-1`,
                  headingFont.className,
                  colorClass,
                  shouldWarn && !isLocked ? "opacity-100" : "opacity-0"
                )}>
                  <span>{nbCharsUsed}</span>
                  <span>&#47;</span>
                  <span>{nbCharsLimits}</span>
                </div>
              </div>
              <div className="flex flex-row w-44">
                <animated.button
                  style={{
                    textShadow: "0px 0px 1px #000000ab",
                    ...submitButtonBouncer
                  }}
                  onMouseEnter={() => setOverSubmitButton(true)}
                  onMouseLeave={() => setOverSubmitButton(false)}
                  className={cn(
                    `px-4 h-16`,
                    `rounded-full`,
                    `transition-all duration-300 ease-in-out`,
                    `backdrop-blur-sm`,
                    isLocked
                      ? `bg-orange-200/50 text-sky-50/80 border-yellow-600/10`
                      : `bg-yellow-400/70 text-sky-50  border-yellow-800/20 hover:bg-yellow-400/80`,
                    `text-center`,
                    `w-full`,
                    `text-2xl `,
                    `border`,
                    headingFont.className,
                    // `transition-all duration-300`,
                    // `hover:animate-bounce`
                  )}
                  disabled={isLocked}
                  onClick={handleSubmit}
                  >
                  {isLocked
                    ? `Dreaming..`
                    : "Dream"
                  }
                </animated.button>
              </div>
            </div>
          </div>

        </div>
        <div
        className={cn(
        `flex flex-col`,
        `w-full md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[85vh]`,
        `space-y-8`,
       //  `transition-all duration-300 ease-in-out`,
      )}>
      
        <div
          className={cn(
            `flex flex-col`,
            `flex-grow rounded-2xl md:rounded-3xl`,
            `backdrop-blur-md bg-gray-800/30`,
            `border-2 border-white/10`,
            `items-center`,
            `space-y-6 md:space-y-8 lg:space-y-12 xl:space-y-14`,
            `px-3 py-6 md:px-6 md:py-12 xl:px-8 xl:py-14`,
             storyLines.length
               ? 'scale-100'
               : 'scale-0'
          )}>
            {assetUrl ? <div
              className={cn(
                `flex flex-col`,
                `space-y-3 md:space-y-6`,
                `items-center`,
              )}>
                {assetUrl && <img
                  src={assetUrl}
                  className={cn(
                    `w-[512px] object-cover`,
                    `rounded-2xl`
                    )}
                />}
            </div> : null}

            <div className={cn(
              `flex flex-col md:flex-row`,
              `space-y-3 md:space-y-0 md:space-x-3`,
              ` w-full md:max-w-[1024px]`,
              `items-center justify-between`
            )}>
              <div className={cn(
                `flex flex-col flex-grow w-full space-y-2 text-2xl text-blue-200/90`
              )}>
                {storyLines.map((line, i) =>
                  <div
                    key={`${line.text}_${i}`}

                    // TODO change a color if we have progressed at the current index (i)
                    className={cn()}
                    >{
                      line.text
                    }</div>)}
              </div>
            </div>
          </div>

        </div>

      </TooltipProvider>
    </div>
  )
}
