import Fastify from "fastify"
import { PrismaClient } from "@prisma/client"
import { generateApiKey } from "./utils/apiKey.js"
import { generateToken } from "./utils/jitsi.js"

const app = Fastify({ logger: true })
const prisma = new PrismaClient()

// ==========================
// Middleware API Key
// ==========================
async function authenticate(request, reply) {
  const apiKey = request.headers["x-api-key"]

  if (!apiKey)
    return reply.status(401).send({ message: "API Key ausente" })

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey }
  })

  if (!key || key.status !== "ACTIVE")
    return reply.status(403).send({ message: "API Key inválida" })
}

// ==========================
// Criar API Key
// ==========================
app.post("/admin/api-keys", async (req, reply) => {
  const { name } = req.body

  const newKey = generateApiKey()

  const apiKey = await prisma.apiKey.create({
    data: {
      key: newKey,
      name
    }
  })

  return { apiKey: apiKey.key }
})

// ==========================
// Criar Reunião
// ==========================
app.post("/meetings", { preHandler: authenticate }, async (req, reply) => {

  const { roomName, startAt, endAt, moderator, patients } = req.body

  const meeting = await prisma.meeting.create({
    data: {
      roomName,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      maxParticipants: parseInt(process.env.MAX_PARTICIPANTS),
      participants: {
        create: [
          { ...moderator, role: "MODERATOR" },
          ...patients.map(p => ({ ...p, role: "PATIENT" }))
        ]
      }
    }
  })

  return { meetingId: meeting.id }
})

// ==========================
// Entrar na reunião
// ==========================
app.get("/meetings/:id/join", async (req, reply) => {

  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    include: { participants: true }
  })

  if (!meeting) return reply.status(404).send()

  const now = new Date()

  if (now < meeting.startAt)
    return reply.status(403).send({ message: "Ainda não iniciou" })

  if (now > meeting.endAt)
    return reply.status(403).send({ message: "Encerrada" })

  if (meeting.status === "SCHEDULED") {
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: "ACTIVE" }
    })
  }

  const links = meeting.participants.map(p => ({
    email: p.email,
    role: p.role,
    link: `http://${process.env.JITSI_DOMAIN}/${meeting.roomName}?jwt=${generateToken(
      meeting.roomName,
      p,
      p.role === "MODERATOR"
    )}`
  }))

  return links
})

app.listen({ port: 3000, host: "0.0.0.0" })