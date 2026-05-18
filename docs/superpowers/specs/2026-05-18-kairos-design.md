# Kairos — End-to-End Encrypted Secrets Manager: Design

Date: 2026-05-18

## Overview

A secrets management platform with **end-to-end encryption (E2EE)**. Secrets are encrypted client-side using a Data Encryption Key (DEK) that the server never sees in plaintext. Devices exchange DEKs via asymmetric key wrapping (X25519 ECDH). Three clients: a **Next.js 14 Web UI**, a **NestJS backend**, and an **oclif CLI**.

---

## Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| ORM | TypeORM (not Prisma) | User specified |
| Auth tokens | Long-lived JWT access token only | No refresh tokens — simpler stateless auth |
| Monorepo | pnpm workspaces | Simpler than Nx for this project size |
| Docker | API + PostgreSQL only | Web/CLI run locally in dev |
| DB entity location | `packages/db` | Single source of truth for schema |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), RTK Query, TypeScript |
| Backend | NestJS, TypeScript, TypeORM |
| CLI | oclif v3, TypeScript |
| Database | PostgreSQL 16 |
| Auth | Password-based (Argon2id), long-lived JWT |
| Crypto | `@noble/curves` (X25519), `@noble/hashes` (HKDF/SHA256), WebCrypto AES-GCM |
| Transport | HTTP, JWT Bearer tokens |

---

## Monorepo Structure

```
kairos/
├── apps/
│   ├── api/                    # NestJS backend
│   ├── web/                    # Next.js 14 frontend
│   └── cli/                    # oclif v3 CLI
├── packages/
│   ├── db/                     # TypeORM entities + migrations + DataSource
│   │   └── src/
│   │       ├── entities/       # User, Device, Project, Environment, WrappedDEK, Secret
│   │       ├── migrations/
│   │       └── data-source.ts
│   ├── crypto/                 # Shared Node.js crypto utilities (CLI + API)
│   └── types/                  # Plain TS interfaces (no runtime deps)
├── docker-compose.yml
├── docker-compose.override.yml # dev volumes + env overrides
├── pnpm-workspace.yaml
└── package.json
```

---

## Docker

### docker-compose.yml

Two services:

- **postgres** — `postgres:16-alpine`, healthcheck with `pg_isready`, named volume `postgres_data`
- **api** — built from `apps/api/Dockerfile`, `depends_on: postgres: condition: service_healthy`, runs migrations then starts

### apps/api/Dockerfile

Multi-stage build:
1. `builder` — installs deps, compiles TypeScript
2. `runner` — copies dist + node_modules, non-root user, runs `typeorm migration:run && node dist/main`

---

## Database (TypeORM — packages/db)

### Entities

```
User          id, email, password (Argon2id hash), createdAt
Device        id, userId, type (web|cli|recovery_device), status (pending|active|revoked),
              publicKey (base64), label, createdAt
Project       id, userId, name, createdAt
Environment   id, projectId, name, createdAt
WrappedDEK    id, environmentId, deviceId (nullable), wrappedDEK (base64),
              isRecovery (bool), createdAt
Secret        id, environmentId, key, encryptedValue (base64), iv (base64),
              createdAt, updatedAt
```

`DataSource` configured from `DATABASE_URL` env var. `synchronize: false`. Migrations run on container start.

---

## Authentication

### Simplified — long-lived JWT only

- `POST /api/auth/register` — hash password with Argon2id, create User, return `{ accessToken }`
- `POST /api/auth/login` — verify Argon2id hash, return `{ accessToken }`
- `POST /api/auth/logout` — no server action (client discards token)

Token is a signed JWT with `sub: userId`, expiry configurable (default 30 days).

All other endpoints protected by `JwtAuthGuard`. No refresh tokens, no HttpOnly cookies, no blocklist.

---

## Backend — NestJS Module Structure

```
apps/api/src/
├── auth/           auth.module, auth.service, auth.controller, jwt.strategy
├── devices/        devices.module, devices.service, devices.controller
├── projects/       projects.module, projects.service, projects.controller
├── environments/   environments.module, environments.service, environments.controller
├── secrets/        secrets.module, secrets.service, secrets.controller
├── sync/           sync.module, sync.service, sync.controller
├── recovery/       recovery.module, recovery.service, recovery.controller
└── database/       database.module (TypeORM DataSource provider, global)
```

### API Endpoints

**Auth**
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

**Devices**
- `POST   /api/devices/register`
- `POST   /api/devices/complete-registration`
- `GET    /api/devices/pending`
- `POST   /api/devices/complete-approval`
- `GET    /api/devices`
- `DELETE /api/devices/:id`

**Projects & Environments**
- `POST /api/projects`
- `GET  /api/projects`
- `POST /api/projects/:id/environments`
- `GET  /api/projects/:id/environments`

**Secrets**
- `GET    /api/environments/:id/secrets`
- `POST   /api/environments/:id/secrets`
- `DELETE /api/environments/:id/secrets/:key`

**Sync**
- `GET /api/sync/:environmentId`

**Recovery**
- `POST /api/recovery/initiate`
- `POST /api/devices/complete-recovery`

### Security invariants enforced server-side
- All routes except register/login require `JwtAuthGuard`
- Device/secret/sync endpoints verify JWT `sub` owns the resource
- `SyncService` rejects requests from `pending` or `revoked` devices
- Server stores only wrapped (encrypted) DEKs and encrypted secret values — never plaintext

---

## Cryptography

### Key Generation (X25519 via @noble/curves)

```ts
import { x25519 } from '@noble/curves/ed25519';
const privateKey = x25519.utils.randomPrivateKey(); // 32 bytes
const publicKey  = x25519.getPublicKey(privateKey);
```

### DEK Generation (AES-256 key)

```ts
const dek = crypto.getRandomValues(new Uint8Array(32));
```

### Wrapping DEK for a Device (ECDH + HKDF + AES-GCM)

1. `sharedSecret = x25519.getSharedSecret(privateA, publicB)`
2. `wrapKey = HKDF-SHA256(sharedSecret, salt, "dek-wrapping-v1")` → 32 bytes
3. `wrappedDEK = AES-256-GCM(wrapKey, dek)` with random 12-byte IV
4. Encoded as `base64(iv || ciphertext || authTag)`

### Self-Wrap (Web UI own device)

`wrapKey = HKDF(SHA256(privateA), randomSalt, "self-wrap-v1")` — salt (16 bytes) prepended to the wrappedDEK blob: `base64(salt || iv || ciphertext || authTag)`. Receiver strips first 16 bytes as salt before decrypting.

### Recovery Key

256-bit random, shown once as BIP39 24-word mnemonic. `wrappedDEK_recovery = AES-256-GCM(recoveryKey, dek)`. No ECDH.

### Secret Encryption

```ts
const iv = crypto.getRandomValues(new Uint8Array(12));
const encryptedValue = AES-256-GCM(dek, plaintext, iv);
// Stored as base64(iv), base64(encryptedValue)
```

---

## Frontend — Next.js 14

```
apps/web/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/register/page.tsx
│   ├── dashboard/page.tsx
│   ├── dashboard/projects/[projectId]/environments/[envId]/page.tsx
│   ├── devices/page.tsx          ← device list + pending approvals (5s polling)
│   └── recovery/page.tsx
├── lib/
│   ├── crypto/
│   │   ├── keypair.ts            ← X25519 keygen + IndexedDB storage
│   │   ├── dek.ts                ← DEK gen, self-wrap, ECDH wrap/unwrap
│   │   ├── secrets.ts            ← AES-256-GCM encrypt/decrypt
│   │   └── recovery.ts           ← BIP39 mnemonic gen, recovery key wrap
│   ├── store/
│   │   ├── api.ts                ← RTK Query all endpoints
│   │   ├── authSlice.ts          ← accessToken in memory
│   │   └── cryptoSlice.ts        ← DEK + privateKey in memory only
│   └── storage/
│       └── indexeddb.ts          ← privateKey encrypted with PBKDF2-derived key
```

**Session state (all in-memory / Redux):**
- `accessToken` — Redux, memory only
- `privateKey` — loaded from IndexedDB on login, held in Redux
- `DEK` — derived post device registration, held in Redux, never persisted

**IndexedDB key derivation:** `PBKDF2(password, userSalt, 100000, SHA-256)` → AES-GCM key. `userSalt` (16 bytes, random) stored in `localStorage` (not secret — entropy comes from password).

---

## CLI — oclif v3

```
apps/cli/src/
├── commands/
│   ├── auth/login.ts             ← stores JWT to auth.json (0o600)
│   ├── auth/logout.ts            ← deletes auth.json
│   ├── devices/register.ts       ← gen keypair, register, poll approval, auto-sync
│   ├── devices/list.ts
│   ├── projects/list.ts
│   ├── projects/create.ts
│   ├── environments/list.ts
│   ├── environments/create.ts
│   ├── secrets/list.ts           ← sync + decrypt + display
│   ├── secrets/set.ts            ← encrypt + upload
│   ├── secrets/delete.ts
│   └── sync.ts
└── lib/
    ├── crypto.ts                 ← X25519, HKDF, AES-GCM (Node.js)
    ├── keystore.ts               ← ~/.config/kairos/device.key (0o600)
    ├── config.ts                 ← ~/.config/kairos/config.json
    └── api.ts                    ← HTTP client with JWT Bearer header
```

**Key CLI behaviors:**
- `devices register` polls every 5s until approved, then auto-syncs
- DEK never persisted — re-derived from sync each session
- `secrets list/set/delete` require sync to have run in the same process

---

## Environment Variables

### Backend (`apps/api/.env`)

```env
DATABASE_URL=postgresql://kairos:kairos_dev@postgres:5432/kairos
JWT_ACCESS_SECRET=changeme
JWT_ACCESS_EXPIRY=30d
PORT=3001
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Security Invariants

| Invariant | Enforced By |
|---|---|
| Server never sees plaintext DEK | DEK generated client-side; only wrapped DEK transmitted |
| Server never sees plaintext secrets | Encrypted client-side before upload |
| Server never sees private keys | Generated and stored locally per device |
| Recovery key shown only once | Frontend only; never stored server-side |
| Pending devices cannot sync | Status guard in SyncService |
| Revoked devices cannot sync | Status guard in SyncService |
| Password never stored plaintext | Argon2id hash only |
