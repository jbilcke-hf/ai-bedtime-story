
import type { NextRequest, NextResponse } from 'next/server'

import qs from 'qs'

// the client ID of your OAuth app (public)
// process.env.OAUTH_CLIENT_ID

//  the client secret of your OAuth app
// process.env.OAUTH_CLIENT_SECRET

//  scopes accessible by your OAuth app. Currently, this is always "openid profile".
// process.env.OAUTH_SCOPES

// The URL of the OpenID provider. The OpenID metadata will be available at {OPENID_PROVIDER_URL}/.well-known/openid-configuration.
// process.env.OPENID_PROVIDER_URL

// process.env.SPACE_HOST

// login stages:
// Redirect the user to https://huggingface.co/oauth/authorize?redirect_uri={REDIRECT_URI}&scope=openid%20profile&client_id={CLIENT_ID}&state={STATE}, where STATE is a random string that you will need to verify later.

export async function GET(request: NextRequest, response: NextResponse) {
  const rawParams = request.url.split('?')[1]
  const params = qs.parse(rawParams)
  console.log("params:", params)

  const { code } = params

  const client_id = ""
  const grant_type = ""

  // Use the code query parameter to get an access token and id token from 
  // https://huggingface.co/oauth/token (POST request with client_id, code, grant_type=authorization_code and redirect_uri as form data, and with Authorization: Basic {base64(client_id:client_secret)} as a header).

  /*
  const res = await fetch("https://huggingface.co/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(client_id)}`,
    },
    body: JSON.stringify({
      client_id,
      code,
      grant_type
    })
  })

  console.log("res:", res)
  */
}

