# Kairos — E2EE Secrets Manager

> Your private key never leaves your device.

Kairos is an end-to-end encrypted secrets manager built for developers and teams. Secrets are encrypted on your device before being sent to the server — the server stores only ciphertext and never sees plaintext values, DEKs, or private keys. Pull secrets into any environment with a single CLI command.

**Live:** [kairoscli.vercel.app](https://kairoscli.vercel.app)

---

## Why I Built This

Most secrets managers — even the popular ones — encrypt secrets *at rest* on the server side. That means the server can technically decrypt your `DATABASE_URL` or `STRIPE_SECRET_KEY`. You're trusting the vendor's infrastructure, their employees, and their key management.

Kairos takes a different approach: secrets are encrypted on your device using a Data Encryption Key (DEK) that the server never sees. The server stores blobs it cannot read. Even a full database leak exposes nothing.

I built this because I wanted a lightweight, self-hostable, CLI-first secrets tool with true end-to-end encryption — one where the security model is simple enough to reason about in a single document.

---

## How It Works

### Encryption Model

Each environment has a **Data Encryption Key (DEK)** — a random 256-bit AES-GCM key that exists only on approved devices. The server never receives it in plaintext.

When you add a secret:
1. Your device encrypts the value with the DEK using AES-256-GCM
2. Only the ciphertext + IV are sent to the server

When you pull secrets:
1. The server returns the encrypted blob
2. Your device decrypts it locally using the DEK

### Multi-Device via X25519 ECDH

Each device generates an **X25519 keypair** on registration. The private key never leaves that device.

When a new device (e.g. your laptop CLI) is approved:
1. The approving device (web UI) performs ECDH: `sharedSecret = x25519(myPrivateKey, newDevicePublicKey)`
2. The DEK is wrapped (encrypted) using a key derived from that shared secret
3. The wrapped DEK is stored on the server — only the new device can unwrap it using its private key

This means a device can be approved without either device transmitting secrets in plaintext.

### Recovery

On first use, a 12-word BIP39 mnemonic is generated and shown once. It can be used to reset your password or recover your DEK if all devices are lost. The mnemonic is never sent to the server.

---

## Features

- **True E2EE** — AES-256-GCM, X25519 ECDH key wrapping, server sees only ciphertext
- **CLI-first** — pull secrets into `.env` files, CI pipelines, or your terminal with one command
- **Multi-device** — approve devices from the web UI; each gets its own wrapped DEK
- **Deploy tokens** — scoped read-only tokens for CI/CD pipelines (no login, no device)
- **Password reset** — uses your recovery mnemonic, no email link required
- **Dark / light mode** — because it matters
- **Self-hostable** — Postgres + Docker Compose, one command to run locally

---

## Quick Install (CLI)

**Linux / macOS**
```sh
curl -sL https://kairoscli.vercel.app/install | sh
```

**Windows (PowerShell)**
```powershell
irm https://kairoscli.vercel.app/install.ps1 | iex
```

---

## CLI Usage

```sh
# Sign in
kairos login

# Switch to a project / environment (registers device on first run)
kairos switch

# Decrypt and print secrets
kairos secrets

# Write secrets to .env in current directory
kairos secrets -g

# Write secrets to a specific file
kairos secrets -g .env.local

# List all environments
kairos environments list

# Name this device
kairos name "my-macbook"
```

### Deploy Tokens (CI/CD)

Generate a token from the web UI (**Project → Deploy Token**), then:

```sh
# GitHub Actions / any CI
kairos run --token $KAIROS_TOKEN -- your-build-command
```

Secrets are injected as environment variables for the duration of the command.

```yaml
# GitHub Actions example
- name: Pull secrets and deploy
  run: kairos run --token ${{ secrets.KAIROS_TOKEN }} -- ./deploy.sh
```

---

## Architecture

```
kairos/
├── apps/
│   ├── api/        # NestJS REST API
│   ├── web/        # Next.js 14 web UI
│   └── cli/        # oclif CLI
├── packages/
│   ├── crypto/     # Shared crypto primitives (X25519, AES-GCM, HKDF)
│   ├── db/         # Prisma schema + client
│   └── types/      # Shared TypeScript types
└── docker-compose.yml
```

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Redux Toolkit, RTK Query |
| Backend | NestJS, Prisma ORM, PostgreSQL |
| CLI | oclif v3, TypeScript |
| Crypto | `@noble/curves` (X25519), `@noble/hashes` (HKDF), WebCrypto AES-GCM |
| Auth | Argon2id password hashing, JWT access + refresh tokens |
| Hosting | Vercel (web), Render (API) |

### Infrastructure

```
Browser / CLI                 Server (NestJS)              DB (Postgres)
─────────────────             ─────────────────────        ──────────────
Generate DEK          ──►     Store wrapped DEK             wrappedDEK (blob)
Encrypt secret        ──►     Store ciphertext + IV         encryptedValue, iv
Pull ciphertext       ◄──     Return encrypted blobs        
Decrypt locally                                             
```

The server is a dumb store for encrypted blobs. It enforces auth and device approval — it cannot read your secrets.

---

## Self-Hosting

**Requirements:** Docker, Docker Compose, Node.js 20+, pnpm

```sh
git clone https://github.com/marufbinsalim/kairos
cd kairos
pnpm install

# Start Postgres
docker-compose up -d postgres

# Configure API
cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET

# Run API
pnpm dev:api

# Run web UI
pnpm dev:web
```

Or run everything with Docker:

```sh
docker-compose up
```

### Environment Variables

**API (`apps/api/.env`)**
```env
DATABASE_URL=postgresql://kairos:kairos_dev@localhost:5434/kairos
JWT_ACCESS_SECRET=your-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=5005
```

---

## Security Model

| Property | How |
|---|---|
| Server never sees plaintext secrets | Encrypted client-side before upload |
| Server never sees the DEK | DEK generated locally; only wrapped (ECDH-encrypted) form stored |
| Server never sees private keys | Generated and stored per-device only |
| Recovery key shown only once | Never transmitted; only wrapped DEK stored server-side |
| New devices require explicit approval | `pending` status until a trusted device wraps the DEK |
| Revoked devices cannot sync | Status check enforced in sync endpoint |
| Passwords never stored plaintext | Argon2id hash only |
| Refresh tokens are rotated | Old token invalidated on each use |

---

## License

MIT
