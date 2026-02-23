import jwt from "jsonwebtoken"

export function generateToken(room, user, isModerator) {
  return jwt.sign(
    {
      aud: "meetapp",
      iss: "meetapp",
      sub: process.env.JITSI_DOMAIN,
      room,
      context: {
        user: {
          name: user.name,
          email: user.email,
          moderator: isModerator
        }
      }
    },
    process.env.JITSI_SECRET,
    { expiresIn: "1h" }
  )
}