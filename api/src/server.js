import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { generateApiKey } from "./utils/apiKey.js";
import { generateToken } from "./utils/jitsi.js";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

// ==========================
// Middleware API Key
// ==========================
async function authenticate(request, reply) {
  const apiKey = request.headers["x-api-key"];
  if (!apiKey)
    return reply.status(401).send({ message: "API Key ausente" });

  const key = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  if (!key || key.status !== "ACTIVE")
    return reply.status(403).send({ message: "API Key inválida" });
}

// ==========================
// Criar API Key
// ==========================
app.post("/api-keys", async (req, reply) => {
  const { name } = req.body;
  const newKey = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: { key: newKey, name }
  });

  return { apiKey: apiKey.key };
});

// ==========================
// Criar Reunião
// ==========================
// Criar Reunião
app.post("/create-meeting", { preHandler: authenticate }, async (req, reply) => {
  const { roomName, startAt, endAt, moderator, patients } = req.body;

  const meeting = await prisma.meeting.create({
    data: {
      roomName,
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      maxParticipants: parseInt(process.env.MAX_PARTICIPANTS || "10"),
      participants: {
        create: [
          { ...moderator, role: "MODERATOR" },
          ...patients.map(p => ({ ...p, role: "PATIENT" }))
        ]
      }
    },
    include: { participants: true }
  });

  const baseUrl = `http://localhost:8081`; // local

  const moderatorUser = meeting.participants.find(p => p.role === "MODERATOR");
  const patientUsers = meeting.participants.filter(p => p.role === "PATIENT");

  // Token do moderador
  const moderatorLink = `${baseUrl}/${meeting.roomName}?jwt=${generateToken(
    meeting.roomName,
    moderatorUser,
    true // booleano real
  )}`;

  // Tokens dos pacientes
  const patientLinks = patientUsers.map(p => ({
    email: p.email,
    link: `${baseUrl}/${meeting.roomName}?jwt=${generateToken(
      meeting.roomName,
      p,
      false // booleano real
    )}`
  }));

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
  };
});

// ==========================
// Entrar na reunião
// ==========================
app.get("/meetings/:id/join", async (req, reply) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: req.params.id },
    include: { participants: true }
  });

  if (!meeting) return reply.status(404).send({ message: "Reunião não encontrada" });

  const baseUrl = `http://localhost:8081`;

  const moderator = meeting.participants.find(p => p.role === "MODERATOR");
  const patients = meeting.participants.filter(p => p.role === "PATIENT");

  const moderatorLink = `${baseUrl}/${meeting.roomName}?jwt=${generateToken(meeting.roomName, moderator, true)}`;
  const patientLinks = patients.map(p => ({
    email: p.email,
    link: `${baseUrl}/${meeting.roomName}?jwt=${generateToken(meeting.roomName, p, false)}`
  }));

  return { room: meeting.roomName, status: "ACTIVE", links: { moderator: moderatorLink, patients: patientLinks } };
});

app.listen({ port: 3000, host: "0.0.0.0" });