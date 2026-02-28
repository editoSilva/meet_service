import crypto from "crypto"

export function generateApiKey() {
  const random = crypto.randomBytes(16).toString("hex")
  return `token_${random}`
}