# MEET SERVICE


## 📁 Estrutura do Projeto

```text
meet-project/
│
├── docker-compose.yml      # Orquestração dos containers
├── .env                    # Variáveis de ambiente
│
├── nginx/                  # Reverse proxy
│   └── nginx.conf
│
├── api/                    # Backend Fastify
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── server.js
│       └── utils/
│           ├── jitsi.js
│           └── apiKey.js
│
├── recordings/             # Gravações do Jitsi
└── jitsi/                  # Configurações opcionais do Jitsi
```

## 📁 Criação do Meet
```text

{
  "roomName": "consulta-113694",
  "startAt": "2026-02-25 15:00:00",
  "endAt": "2026-02-25 16:00:00",
  "maxParticipants": 3,
  "moderator": {
    "name": "Dr João",
    "email": "dr@email.com"
  },
  "patients": [
    {
      "name": "Maria",
      "email": "maria@email.com"
    }
  ]
}

```