# ![RealWorld Example App](logo.png)

RealWorld Conduit API built with NestJS, Prisma, PostgreSQL, Docker, and pnpm.

This project is based on the RealWorld Conduit starter materials, API
specification, and external conformance test suite from
[realworld-apps/realworld](https://github.com/realworld-apps/realworld).

## Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- pnpm 11
- Docker / Docker Compose

## Getting Started

```bash
pnpm install
cp .env.example .env
# edit JWT_SECRET before running outside local development
docker compose up -d postgres
pnpm prisma:migrate --name init
pnpm start:dev
```

The API listens on `http://localhost:3000/api`.

Implemented RealWorld user endpoints:

- `POST /api/users`
- `POST /api/users/login`
- `GET /api/user`
- `PUT /api/user`
- `GET /api/profiles/:username`
- `POST /api/profiles/:username/follow`
- `DELETE /api/profiles/:username/follow`

## Docker

```bash
docker compose up --build
```

The API container reads `JWT_SECRET`, `JWT_EXPIRES_IN`, and `PORT` from `.env`.
The Postgres container reads `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD`
from `.env`.

## Prisma

```bash
pnpm prisma:generate
pnpm prisma:migrate --name init
pnpm prisma:studio
```
