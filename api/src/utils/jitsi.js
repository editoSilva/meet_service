import jwt from "jsonwebtoken";

export function generateToken(room, user, isModerator) {

  return jwt.sign(
    {
      aud: "jitsi",
      iss: "meetapp",
      sub: process.env.JITSI_DOMAIN, // "localhost"
      room,
      exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60,
      context: {
        user: {
          name: user.name,
          email: user.email
        },
        features: {
          moderator: Boolean(isModerator)
        }
      }
    },
    process.env.JWT_APP_SECRET
  );
}