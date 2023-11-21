"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useSpring, animated } from "@react-spring/web"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { headingFont } from "@/app/interface/fonts"
import { useCharacterLimit } from "@/lib/useCharacterLimit"
import { generateStory } from "@/app/server/actions/generateStory"
import { getLatestPosts, getPost, postToCommunity } from "@/app/server/actions/community"
import { HotshotImageInferenceSize, Post, SDXLModel, Story, TTSVoice } from "@/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipProvider } from "@radix-ui/react-tooltip"

import { useCountdown } from "@/lib/useCountdown"

import { Countdown } from "../countdown"
import { useAudio } from "@/lib/useAudio"

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

  const [story, setStory] = useState<Story>({ text: "", audio: "" })
  const storyText = story?.text || ""
  const audioData = story?.audio || ""

  const [stage, setStage] = useState<Stage>("generate")
  
  const { toast } = useToast()

  const [typedStoryText, setTypedStoryText] = useState("")
  const [typedStoryCharacterIndex, setTypedStoryCharacterIndex] = useState(0)

  const audio = useAudio()

  useEffect(() => {
    if (storyText && typedStoryCharacterIndex < storyText.length) {
      setTimeout(() => {
        setTypedStoryText(typedStoryText + story.text[typedStoryCharacterIndex])
        setTypedStoryCharacterIndex(typedStoryCharacterIndex + 1)
      }, 40)
    }
  }, [storyText, typedStoryCharacterIndex])
  
  const { progressPercent, remainingTimeInSec } = useCountdown({
    isActive: isLocked,
    timerId: runs, // everytime we change this, the timer will reset
    durationInSec: /*stage === "interpolate" ? 30 :*/ 25, // it usually takes 40 seconds, but there might be lag
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

      let story: Story = {
        text: "",
        audio: ""
      }

      const voice: TTSVoice = "Cloée"
      
      setRuns(runsRef.current + 1)

      try {
        // console.log("starting transition, calling generateAnimation")
        story = await generateStory(promptDraft, voice)

        console.log("generated story:", story)

        if (!story) {
          throw new Error("invalid story")
        }

        (window as any)["debugJuju"] = story

        setStory(story)

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
    if (!audioData) {
      return
    }
    console.log("story audio changed!", audioData)

    try {
      audio(audioData) // play
    } catch (err) {
      console.error(err)
    }

    return () => {
      audio() // stop
    }
  }, [audioData])

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
            `flex-grow rounded-2xl md:rounded-3xl`,
            `backdrop-blur-md bg-gray-800/30`,
            `border-2 border-white/10`,
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
                    `placeholder:text-gray-400`,
                    `disabled:bg-gray-500 disabled:text-yellow-300 disabled:border-transparent`,
                    isLocked
                      ? `bg-gray-600 text-yellow-300 border-transparent`
                      : `bg-white/10 text-yellow-400 selection:bg-yellow-200`,
                    `text-left`,
                    `text-xl leading-10 px-6 h-16 pt-1`,
                    `selection:bg-yellow-200 selection:text-yellow-200`
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
                  `bg-yellow-200`,
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
              <div className="flex flex-row w-52">
                <animated.button
                  style={{
                    textShadow: "0px 0px 1px #000000ab",
                    ...submitButtonBouncer
                  }}
                  onMouseEnter={() => setOverSubmitButton(true)}
                  onMouseLeave={() => setOverSubmitButton(false)}
                  className={cn(
                    `px-6 py-3`,
                    `rounded-full`,
                    `transition-all duration-300 ease-in-out`,
                    isLocked
                      ? `bg-orange-500/20  border-orange-800/10`
                      : `bg-yellow-500/80 hover:bg-yellow-400/100  border-yellow-800/20`,
                    `text-center`,
                    `w-full`,
                    `text-2xl text-sky-50`,
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
            story.text ? 'scale-1' : 'scale-0'
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
              <p>{storyText}</p>
              </div>
            </div>
          </div>

        </div>

      
      </TooltipProvider>
    </div>
  )
}
