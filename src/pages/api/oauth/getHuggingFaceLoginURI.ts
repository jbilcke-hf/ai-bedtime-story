import { getRedirectURI } from "./getRedirectURI"

export function getHuggingFaceLoginURI({ clientId }: { clientId: string }) {

  const randomId = Math.round(Math.random() * 1000000) // to store in redis

  return [
    `https://huggingface.co/oauth/authorize?redirect_uri=`,
    getRedirectURI(),
    `&scope=openid%20profile`,
    `&client_id=`,
    clientId,
    `&state=`,
    randomId
  ].join('')
}