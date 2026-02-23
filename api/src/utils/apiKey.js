import crypto from "crypto"

export function generateApiKey() {
  const random = crypto.randomBytes(32).toString("hex")
  return `sk_live_${random}`
}