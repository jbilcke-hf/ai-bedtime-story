"use server"

import { v4 as uuidv4 } from "uuid"

import { CreatePostResponse, GetAppPostResponse, GetAppPostsResponse, Post, PostVisibility } from "@/types"
import { filterOutBadWords } from "./censorship"

const apiUrl = `${process.env.COMMUNITY_API_URL || ""}`
const apiToken = `${process.env.COMMUNITY_API_TOKEN || ""}`
const appId = `${process.env.COMMUNITY_API_ID || ""}`
const secretModerationKey = `${process.env.MODERATION_KEY || ""}`

export async function postToCommunity({
  prompt = "",
  model = "",
  assetUrl = "",
}: {
  prompt: string
  model: string,
  assetUrl: string
}): Promise<Post> {

  const before = prompt
  prompt = filterOutBadWords(prompt)

  if (prompt !== before) {
    console.log(`user attempted to use bad words! their original prompt is: ${before}`)
  }

  if (prompt.toLocaleLowerCase().includes("male muscle") || prompt.toLocaleLowerCase().includes("muscle growth")) {
    throw new Error("unknown erorr")
  }

  // if the community API is disabled,
  // we don't fail, we just mock
  if (!apiUrl) {
    const mockPost: Post = {
      postId: uuidv4(),
      appId: "mock",
      prompt,
      model,
      previewUrl: assetUrl,
      assetUrl,
      createdAt: new Date().toISOString(),
      visibility: "normal",
      upvotes: 0,
      downvotes: 0
    }
    return mockPost
  }

  if (!prompt) {
    console.error(`cannot call the community API without a prompt, aborting..`)
    throw new Error(`cannot call the community API without a prompt, aborting..`)
  }
  if (!assetUrl) {
    console.error(`cannot call the community API without an assetUrl, aborting..`)
    throw new Error(`cannot call the community API without an assetUrl, aborting..`)
  }

  try {
    console.log(`calling POST ${apiUrl}/posts/${appId} with prompt: ${prompt}`)

    const postId = uuidv4()

    const post: Partial<Post> = { postId, appId, prompt, model, assetUrl }

    console.log(`target url is: ${
      `${apiUrl}/posts/${appId}`
    }`)

    const res = await fetch(`${apiUrl}/posts/${appId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(post),
      cache: 'no-store',
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
    })

    // Recommendation: handle errors
    if (res.status !== 201) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    
    const response = (await res.json()) as CreatePostResponse
    // console.log("response:", response)
    return response.post
  } catch (err) {
    const error = `failed to post to community: ${err}`
    console.error(error)
    throw new Error(error)
  }
}

export async function getLatestPosts({
  visibility,
  maxNbPosts = 80,
  shuffle = true,
}: {
  visibility?: PostVisibility
  maxNbPosts?: number
  shuffle?: boolean
}): Promise<Post[]> {

  let posts: Post[] = []

  // if the community API is disabled we don't fail,
  // we just mock
  if (!apiUrl) {
    return posts
  }

  try {
    // console.log(`calling GET ${apiUrl}/posts with renderId: ${renderId}`)
    // TODO: send the max number of posts
    const res = await fetch(`${apiUrl}/posts/${appId}/firehose/${
      visibility || "all"
    }/${
      maxNbPosts || 80
    }/${
      !!shuffle
    }`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      cache: 'no-store',
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
    })

    // console.log("res:", res)
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.
    
    // Recommendation: handle errors
    if (res.status !== 200) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    
    const response = (await res.json()) as GetAppPostsResponse
    // console.log("response:", response)

    const posts: Post[] = Array.isArray(response?.posts) ? response?.posts : []

    return posts
  } catch (err) {
    // const error = `failed to get posts: ${err}`
    // console.error(error)
    // throw new Error(error)
    return []
  }
}

export async function getPost(postId: string): Promise<Post> {

 // if the community API is disabled we don't fail,
  // we just mock
  if (!apiUrl) {
    throw new Error("community API is not enabled")
  }

  try {
    // console.log(`calling GET ${apiUrl}/posts with renderId: ${renderId}`)
    const res = await fetch(`${apiUrl}/posts/${appId}/${postId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      cache: 'no-store',
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
    })

    // console.log("res:", res)
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.
    
    // Recommendation: handle errors
    if (res.status !== 200) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    
    const response = (await res.json()) as GetAppPostResponse
    // console.log("response:", response)
    return response.post
  } catch (err) {
    const error = `failed to get post: ${err}`
    console.error(error)
    throw new Error(error)
  }
}

export async function deletePost({
  postId,
  moderationKey,
}: {
  postId: string
  moderationKey: string
}): Promise<boolean> {

  // if the community API is disabled,
  // we don't fail, we just mock
  if (!apiUrl) {
    return false
  }

  if (!postId) {
    console.error(`cannot delete a post without a postId, aborting..`)
    throw new Error(`cannot delete a post without a postId, aborting..`)
  }
  if (!moderationKey) {
    console.error(`cannot delete a post without a moderationKey, aborting..`)
    throw new Error(`cannot delete a post without a moderationKey, aborting..`)
  }

  if (moderationKey !== secretModerationKey) {
    console.error(`invalid moderation key, operation denied! please ask an admin for the mdoeration key`)
    throw new Error(`invalid moderation key, operation denied! please ask an admin for the mdoeration key`)
  }

  try {
    console.log(`calling DELETE ${apiUrl}/posts/${appId}/${postId}`)

    const res = await fetch(`${apiUrl}/posts/${appId}/${postId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      cache: 'no-store',
    // we can also use this (see https://vercel.com/blog/vercel-cache-api-nextjs-cache)
    // next: { revalidate: 1 }
    })

    // console.log("res:", res)
    // The return value is *not* serialized
    // You can return Date, Map, Set, etc.
    
    // Recommendation: handle errors
    if (res.status !== 200) {
      // This will activate the closest `error.js` Error Boundary
      throw new Error('Failed to fetch data')
    }
    
    const response = (await res.json()) as CreatePostResponse
    return true
  } catch (err) {
    const error = `failed to delete the post: ${err}`
    console.error(error)
    throw new Error(error)
  }
}
