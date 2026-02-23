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