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
app.post("/api-keys", async (req, reply) => {
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
app.post("/create-meeting", { preHandler: authenticate }, async (req, reply) => {

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
    },
    include: {
      participants: true
    }
  })

  const baseUrl = `http://${process.env.JITSI_DOMAIN}`

  const moderatorUser = meeting.participants.find(p => p.role === "MODERATOR")
  const patientUsers = meeting.participants.filter(p => p.role === "PATIENT")

  const moderatorLink = `${baseUrl}/${meeting.roomName}?jwt=${generateToken(
    meeting.roomName,
    moderatorUser,
    true
  )}`

  const patientLinks = patientUsers.map(p => ({
    email: p.email,
    link: `${baseUrl}/${meeting.roomName}?jwt=${generateToken(
      meeting.roomName,
      p,
      false
    )}`
  }))

  return {
    meetingId: meeting.id,
    room: meeting.roomName,
    status: meeting.status,
    startAt: meeting.startAt,
    endAt: meeting.endAt,
    links: {
      moderator: moderatorLink,
      patients: patientLinks
    }
  }
})


app.get('/teste', async (req, reply) => {
  return {
    'message': 'API funcionando!'
  }
});

// ==========================
// Entrar na reunião
// ==========================
app.get("/meetings/:id/join", async (req, reply) => {

  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    include: { participants: true }
  })

  if (!meeting) {
    return reply.status(404).send({ message: "Reunião não encontrada" })
  }

  return reply.send(meeting)
  
  const now = new Date()

  if (now < meeting.startAt) {
    return reply.status(403).send({ message: "Reunião ainda não iniciou" })
  }

  if (now > meeting.endAt) {
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: "FINISHED" }
    })

    return reply.status(403).send({ message: "Reunião encerrada" })
  }

  // Se estava agendada, ativa automaticamente
  if (meeting.status === "SCHEDULED") {
    await prisma.meeting.update({
      where: { id: meeting.id },
      data: { status: "ACTIVE" }
    })
  }

  const baseUrl = `http://${process.env.JITSI_DOMAIN}`

  const moderator = meeting.participants.find(p => p.role === "MODERATOR")

  const patients = meeting.participants.filter(p => p.role === "PATIENT")

  const moderatorLink = `${baseUrl}/${meeting.roomName}?jwt=${generateToken(
    meeting.roomName,
    moderator,
    true
  )}`

  const patientLinks = patients.map(p => ({
    email: p.email,
    link: `${baseUrl}/${meeting.roomName}?jwt=${generateToken(
      meeting.roomName,
      p,
      false
    )}`
  }))

  return {
    room: meeting.roomName,
    status: "ACTIVE",
    links: {
      moderator: moderatorLink,
      patients: patientLinks
    }
  }
})
app.listen({ port: 3000, host: "0.0.0.0" })