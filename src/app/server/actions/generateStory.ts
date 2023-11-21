"use server"

import { Story, TTSVoice } from "@/types"

const instance = `${process.env.AI_BEDTIME_STORY_API_GRADIO_URL || ""}`
const secretToken = `${process.env.AI_BEDTIME_STORY_API_SECRET_TOKEN || ""}`

export async function generateStory(prompt: string, voice: TTSVoice): Promise<Story> {
  if (!prompt?.length) {
    throw new Error(`prompt is too short!`)
  }

  const cropped = prompt.slice(0, 30)
  console.log(`user requested "${cropped}${cropped !== prompt ? "..." : ""}"`)

  // positivePrompt = filterOutBadWords(positivePrompt)

  const res = await fetch(instance + (instance.endsWith("/") ? "" : "/") + "api/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fn_index: 0, // <- important!
      data: [
        secretToken,
        prompt,
        voice,
      ],
    }),
    cache: "no-store",
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
  })

  console.log("res:", res)
  const rawJson = await res.json()
  console.log("rawJson:", rawJson)
  const data = rawJson.data as Story[]
  console.log("data:", data)

  const story = data?.[0] || { text: "", audio: "" }

  // console.log("story:", story)

  // Recommendation: handle errors
  if (res.status !== 200 || !story?.text || !story?.audio) {

    // This will activate the closest `error.js` Error Boundary
    throw new Error('Failed to fetch data')
  }

  return story
}