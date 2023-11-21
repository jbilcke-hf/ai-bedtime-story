import crypto from "node:crypto"

import { NextApiRequest, NextApiResponse } from "next"

async function handler(req: NextApiRequest, res: NextApiResponse) {
  let ipAddress = req.headers["x-real-ip"] as string

  const forwardedFor = req.headers["x-forwarded-for"] as string

  if (!ipAddress && forwardedFor) {
    ipAddress = forwardedFor?.split(",").at(0) ?? "Unknown"
  }

  console.log("ipAddress:", ipAddress)
  const hash = crypto.createHash('sha256')
  hash.update(ipAddress)
  const digest = hash.digest('hex')
  res.status(200).json(digest)
}

export default handler