# End-to-End Encrypted Secrets Manager — Full System Spec

## Overview

A secrets management platform with **end-to-end encryption (E2EE)** and **password-based authentication**. Secrets are encrypted client-side using a Data Encryption Key (DEK) that the server never sees in plaintext. Devices exchange DEKs via asymmetric key wrapping (X25519 ECDH). Three clients exist: a **Next.js Web UI**, a **NestJS backend**, and an **oclif CLI**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), RTK Query, TypeScript |
| Backend | NestJS, TypeScript, Prisma ORM |
| CLI | oclif v3, TypeScript |
| Database | PostgreSQL |
| Auth | Password-based (Argon2id on server, SRP or standard JWT pattern) |
| Crypto | WebCrypto API (browser), Node.js `crypto` (backend/CLI), X25519 via `@noble/curves` |
| Transport | HTTPS, JWT access tokens + refresh tokens |

---

## Authentication (Password-Based)

### Registration

```
POST /api/auth/register
Body: { email, password }
```

- Server hashes password with **Argon2id** (never stored plaintext)
- Server creates `User` record
- Returns `{ userId, accessToken, refreshToken }`

### Login

```
POST /api/auth/login
Body: { email, password }
```

- Server verifies Argon2id hash
- Returns `{ userId, accessToken, refreshToken }`
- Access token: short-lived JWT (15 min)
- Refresh token: long-lived (7 days), stored in `HttpOnly` cookie

### Refresh

```
POST /api/auth/refresh
```

- Reads `HttpOnly` refresh token cookie
- Returns new `accessToken`

### Logout

```
POST /api/auth/logout
```

- Invalidates refresh token server-side (token rotation + blocklist)

---

## Data Models (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // Argon2id hash
  createdAt DateTime @default(now())

  devices   Device[]
  projects  Project[]
}

model Device {
  id           String       @id @default(cuid())
  userId       String
  user         User         @relation(fields: [userId], references: [id])
  type         DeviceType   // "web" | "cli" | "recovery-device"
  status       DeviceStatus // "pending" | "active" | "revoked"
  publicKey    String       // X25519 public key (base64)
  label        String?      // e.g. "MacBook CLI", "Chrome on Linux"
  createdAt    DateTime     @default(now())

  wrappedDEKs WrappedDEK[]
}

model Project {
  id           String        @id @default(cuid())
  userId       String
  user         User          @relation(fields: [userId], references: [id])
  name         String
  createdAt    DateTime      @default(now())

  environments Environment[]
}

model Environment {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  name      String   // e.g. "production", "staging"
  createdAt DateTime @default(now())

  secrets      Secret[]
  wrappedDEKs  WrappedDEK[]
}

model WrappedDEK {
  id            String      @id @default(cuid())
  environmentId String
  environment   Environment @relation(fields: [environmentId], references: [id])
  deviceId      String?     // null for recovery entry
  device        Device?     @relation(fields: [deviceId], references: [id])
  wrappedDEK    String      // base64-encoded, wrapped (encrypted) DEK
  isRecovery    Boolean     @default(false)
  createdAt     DateTime    @default(now())
}

model Secret {
  id            String      @id @default(cuid())
  environmentId String
  environment   Environment @relation(fields: [environmentId], references: [id])
  key           String      // plaintext key name (e.g. "DATABASE_URL")
  encryptedValue String     // AES-256-GCM encrypted, base64
  iv            String      // AES-GCM IV, base64
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

enum DeviceType   { web cli recovery_device }
enum DeviceStatus { pending active revoked }
```

---

## Cryptography Specification

### Key Generation (X25519)

All clients (web, CLI, recovery) generate a keypair using **X25519** (Diffie-Hellman on Curve25519).

```ts
// Using @noble/curves (works in browser + Node)
import { x25519 } from '@noble/curves/ed25519';

const privateKey = x25519.utils.randomPrivateKey(); // 32 bytes
const publicKey  = x25519.getPublicKey(privateKey);  // 32 bytes
```

### DEK Generation (AES-256-GCM)

Generated in-memory on the trusted client, never sent to server in plaintext.

```ts
const dek = crypto.getRandomValues(new Uint8Array(32)); // 256-bit
```

### Wrapping DEK for a Device (ECDH + AES-KW or HKDF + AES-GCM)

To wrap a DEK for a device with public key `publicB`, the wrapping device (holding its own `privateA`) performs:

1. ECDH shared secret: `sharedSecret = x25519.getSharedSecret(privateA, publicB)`
2. Derive a wrapping key: `wrapKey = HKDF-SHA256(sharedSecret, salt, info)` → 32 bytes
3. Encrypt DEK: `wrappedDEK = AES-256-GCM(wrapKey, dek)` with random IV
4. Encode as `base64(iv || ciphertext || authTag)`

To **unwrap**, the receiving device reverses with its own private key and sender's public key.

> **Note for prompting:** You may use `@noble/hashes` for HKDF, and WebCrypto `AES-GCM` for the wrap/unwrap operation. Use consistent `info` string like `"dek-wrapping-v1"`.

### Recovery Key

- 256-bit random value, displayed once as a **BIP39 mnemonic** (24 words) or hex string
- Used as a raw wrapping key directly: `wrappedDEK_recovery = AES-256-GCM(recoveryKey, dek)`
- No ECDH needed — recovery key IS the wrapping key

### Secret Encryption

```ts
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = AES-256-GCM(dek, plaintext, iv);
// Store: base64(iv), base64(ciphertext)
```

---

## API Endpoints (NestJS)

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, get tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout, revoke refresh token |

### Devices

| Method | Path | Description |
|---|---|---|
| POST | `/api/devices/register` | Register new device (pending) |
| POST | `/api/devices/complete-registration` | Web client completes its own registration with wrappedDEK |
| GET | `/api/devices/pending` | Fetch pending devices awaiting approval |
| POST | `/api/devices/complete-approval` | Trusted device approves pending device |
| GET | `/api/devices` | List all active devices |
| DELETE | `/api/devices/:id` | Revoke a device |

### Projects & Environments

| Method | Path | Description |
|---|---|---|
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List user projects |
| POST | `/api/projects/:id/environments` | Create environment |
| GET | `/api/projects/:id/environments` | List environments |

### Secrets

| Method | Path | Description |
|---|---|---|
| GET | `/api/environments/:id/secrets` | Get all secrets (encrypted) for sync |
| POST | `/api/environments/:id/secrets` | Create/update a secret |
| DELETE | `/api/environments/:id/secrets/:key` | Delete a secret |

### Sync (CLI)

| Method | Path | Description |
|---|---|---|
| GET | `/api/sync/:environmentId` | Returns `{ wrappedDEK, secrets[] }` for active device |

### Recovery

| Method | Path | Description |
|---|---|---|
| POST | `/api/recovery/initiate` | Submit recovery key → receive `wrappedDEK_recovery` |
| POST | `/api/devices/complete-recovery` | Register new device, store new wrappedDEK, revoke old devices |

---

## Flow 1: Web UI — Create Project + Environment

### Step-by-step

1. **User registers / logs in** → receives JWT
2. **Client generates X25519 keypair** `(publicA, privateA)`
   - `privateA` stored encrypted in IndexedDB (encrypted with a key derived from user password + device salt using PBKDF2)
3. **Register device**
   ```
   POST /api/devices/register
   { key: publicA (base64), type: "web", label: "Chrome on Linux" }
   → { deviceId: "deviceA" }
   ```
4. **Create project + environment**
   ```
   POST /api/projects         → { projectId }
   POST /api/projects/:id/environments  → { environmentId }
   ```
5. **Client generates DEK** (in-memory, never persisted plaintext)
6. **Client generates Recovery Key** (shown to user once as mnemonic)
7. **Client wraps DEK with Recovery Key** → `wrappedDEK_recovery`
8. **Client wraps DEK with its own publicA** → `wrappedDEK_A` (using ECDH against its own public key — self-wrap: use ephemeral keypair or wrap directly with wrapKey derived from privateA)

   > Implementation note: For self-wrapping, generate a wrapKey as `HKDF(SHA256(privateA), salt, "self-wrap-v1")` and use that for AES-GCM wrapping.

9. **Complete registration**
   ```
   POST /api/devices/complete-registration
   {
     environmentId,
     wrappedDEK: wrappedDEK_A (base64),
     wrappedDEKRecovery: wrappedDEK_recovery (base64)
   }
   ```
10. Server stores both `WrappedDEK` records. Device marked **active**.
11. Client decrypts `wrappedDEK_A` using `privateA` → holds `DEK` in memory
12. **Web UI can now encrypt & decrypt secrets**

---

## Flow 2: CLI Device Registration

### CLI Side

1. **CLI generates X25519 keypair** `(publicB, privateB)`
   - `privateB` stored in `~/.config/<appname>/key` with `chmod 600`, or OS keychain
2. **CLI registers device**
   ```
   POST /api/devices/register
   { key: publicB (base64), type: "cli", label: "MacBook CLI" }
   → { deviceId: "deviceB", status: "pending" }
   ```
3. CLI polls or waits for approval

### Web UI Side (Trusted Approver)

4. Web UI receives notification of pending device (poll `GET /api/devices/pending` or SSE)
5. User sees device info (label, publicKey fingerprint), clicks **Approve**
6. Web UI already holds `DEK` in memory
7. Fetches `publicB` from server
8. **Wraps DEK with publicB** using ECDH (Web UI's `privateA` × `publicB` → `sharedSecret` → `wrapKey`) → `wrappedDEK_B`
9. **Approves device**
   ```
   POST /api/devices/complete-approval
   {
     deviceId: "deviceB",
     environmentId,
     wrappedDEK: wrappedDEK_B (base64)
   }
   ```
10. Server stores `wrappedDEK_B`, marks device **active**

### CLI Side (Post-Approval)

11. CLI detects approval
12. **Syncs environment**
    ```
    GET /api/sync/:environmentId
    → { wrappedDEK: wrappedDEK_B, secrets: [ { key, encryptedValue, iv } ] }
    ```
13. CLI unwraps DEK: ECDH(`privateB` × `publicA`) → `sharedSecret` → `wrapKey` → decrypt `wrappedDEK_B`
14. CLI decrypts each secret using DEK + IV
15. CLI is now fully synced

---

## Flow 3: Recovery (All Devices Lost)

1. User selects **"Recover Project"** in Web UI
2. User enters Recovery Key (24-word mnemonic or hex)
3. Client derives raw key bytes from mnemonic
4. **Initiate recovery**
   ```
   POST /api/recovery/initiate
   { environmentId }
   → { wrappedDEK_recovery: "..." }
   ```
5. Client decrypts: `DEK = AES-GCM-Decrypt(recoveryKey, wrappedDEK_recovery)`
6. Client generates new keypair `(publicC, privateC)`
7. **Register new device**
   ```
   POST /api/devices/register
   { key: publicC, type: "recovery-device", label: "Recovery" }
   → { deviceId: "deviceC" }
   ```
8. Client self-wraps DEK using `publicC` → `wrappedDEK_C`
9. **Complete recovery**
   ```
   POST /api/devices/complete-recovery
   {
     deviceId: "deviceC",
     environmentId,
     wrappedDEK: wrappedDEK_C (base64)
   }
   ```
10. Server:
    - Revokes **all existing devices** for this environment
    - Stores new device + `wrappedDEK_C`
    - Marks `deviceC` as **active**
11. Client decrypts `wrappedDEK_C` using `privateC` → holds DEK in memory
12. System is restored. User should re-register CLI if needed.

---

## Frontend — Next.js + RTK Query

### Structure

```
apps/web/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    dashboard/
      page.tsx
      projects/
        [projectId]/
          environments/
            [envId]/
              page.tsx       ← secrets view
    devices/
      page.tsx               ← device management + pending approvals
    recovery/
      page.tsx
  lib/
    crypto/
      keypair.ts             ← X25519 keygen + storage
      dek.ts                 ← DEK gen, wrap, unwrap
      secrets.ts             ← encrypt/decrypt secrets
      recovery.ts            ← recovery key gen + wrap
    store/
      api.ts                 ← RTK Query base API
      authSlice.ts
      deviceSlice.ts
    storage/
      indexeddb.ts           ← encrypted private key storage
```

### RTK Query Endpoints (representative)

```ts
// lib/store/api.ts
export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api', credentials: 'include' }),
  endpoints: (build) => ({
    login:               build.mutation<AuthResponse, LoginArgs>(),
    register:            build.mutation<AuthResponse, RegisterArgs>(),
    registerDevice:      build.mutation<DeviceResponse, RegisterDeviceArgs>(),
    completeRegistration:build.mutation<void, CompleteRegArgs>(),
    listPendingDevices:  build.query<Device[], void>(),
    completeApproval:    build.mutation<void, ApprovalArgs>(),
    createProject:       build.mutation<Project, { name: string }>(),
    listProjects:        build.query<Project[], void>(),
    createEnvironment:   build.mutation<Environment, { projectId: string; name: string }>(),
    syncEnvironment:     build.query<SyncPayload, string>(),
    upsertSecret:        build.mutation<void, UpsertSecretArgs>(),
    deleteSecret:        build.mutation<void, { envId: string; key: string }>(),
    initiateRecovery:    build.mutation<RecoveryPayload, { environmentId: string }>(),
    completeRecovery:    build.mutation<void, CompleteRecoveryArgs>(),
  }),
});
```

### Private Key Storage (IndexedDB)

- On first device registration, generate `(publicKey, privateKey)` using `@noble/curves/ed25519` X25519
- Derive an **IndexedDB encryption key** from user password + random salt using PBKDF2 (100k iterations, SHA-256)
- Encrypt `privateKey` with AES-GCM, store in IndexedDB
- On login, re-derive IndexedDB key using password, decrypt `privateKey` into memory

### Session State

- `accessToken` in memory (Redux state)
- `refreshToken` in `HttpOnly` cookie
- `DEK` in memory only (never persisted)
- `privateKey` in memory only (loaded from IndexedDB on login)

---

## Backend — NestJS

### Module Structure

```
apps/api/
  src/
    auth/
      auth.module.ts
      auth.service.ts        ← register, login, refresh, logout
      auth.controller.ts
      strategies/
        jwt.strategy.ts
        refresh.strategy.ts
    devices/
      devices.module.ts
      devices.service.ts
      devices.controller.ts
    projects/
      projects.module.ts
      projects.service.ts
      projects.controller.ts
    environments/
      environments.module.ts
      environments.service.ts
      environments.controller.ts
    secrets/
      secrets.module.ts
      secrets.service.ts
      secrets.controller.ts
    sync/
      sync.module.ts
      sync.service.ts
      sync.controller.ts
    recovery/
      recovery.module.ts
      recovery.service.ts
      recovery.controller.ts
    prisma/
      prisma.module.ts
      prisma.service.ts
```

### Key Service Responsibilities

**AuthService**
- `register(email, password)` → hash with Argon2id, create User, issue tokens
- `login(email, password)` → verify hash, issue tokens
- `refresh(refreshToken)` → validate, rotate, issue new accessToken
- `logout(userId, refreshToken)` → add token to blocklist

**DevicesService**
- `register(userId, publicKey, type, label)` → create Device (pending)
- `completeRegistration(deviceId, environmentId, wrappedDEK, wrappedDEKRecovery)` → store WrappedDEKs, activate device
- `getPendingDevices(userId)` → list pending devices awaiting approval
- `completeApproval(approverDeviceId, targetDeviceId, environmentId, wrappedDEK)` → store WrappedDEK, activate device
- `revokeDevice(deviceId)` → mark revoked
- `revokeAllDevices(userId, environmentId)` → revoke all for recovery

**SyncService**
- `sync(deviceId, environmentId)` → return `{ wrappedDEK, secrets }` for active device

**RecoveryService**
- `initiate(userId, environmentId)` → return `wrappedDEK_recovery` record
- `completeRecovery(userId, environmentId, newDeviceId, wrappedDEK)` → revoke old devices, store new wrappedDEK

### Security Notes

- All endpoints except `POST /auth/register` and `POST /auth/login` require JWT auth guard
- Device endpoints additionally validate that the requesting user owns the device
- Server never receives or stores plaintext DEK or private keys
- Refresh tokens use rotation + per-token revocation
- `wrappedDEK_recovery` is only returned after authenticated user request with valid session

---

## CLI — oclif

### Structure

```
apps/cli/
  src/
    commands/
      auth/
        login.ts
        logout.ts
      devices/
        register.ts     ← generates keypair, registers device, polls for approval
        list.ts
      projects/
        list.ts
        create.ts
      environments/
        list.ts
        create.ts
      secrets/
        list.ts         ← sync + decrypt + display
        set.ts          ← encrypt + upload
        delete.ts
      sync.ts           ← pull latest wrappedDEK + secrets
    lib/
      crypto.ts         ← X25519 using @noble/curves, HKDF, AES-GCM
      keystore.ts       ← ~/.config/<app>/key (privateKey storage)
      config.ts         ← ~/.config/<app>/config.json (deviceId, environmentId, API URL)
      api.ts            ← Axios/fetch HTTP client with JWT
```

### Key Commands

```bash
# Auth
cli auth login                  # prompts email + password, stores JWT
cli auth logout

# Device
cli devices register            # generates keypair, calls /api/devices/register
                                # polls until approved, then calls /api/sync

# Projects / Environments  
cli projects list
cli projects create --name "my-project"
cli environments list --project <id>

# Secrets (all operations require active device + DEK in memory from sync)
cli secrets sync --env <id>     # fetch wrappedDEK + secrets, decrypt, cache locally (encrypted)
cli secrets list --env <id>
cli secrets set KEY=VALUE --env <id>
cli secrets delete KEY --env <id>
```

### Key Store (CLI)

- Private key stored at `~/.config/<appname>/device.key` as hex, file permissions `0o600`
- Device ID + environment ID + API base URL stored at `~/.config/<appname>/config.json`
- JWT stored at `~/.config/<appname>/auth.json` with `0o600`
- DEK is NOT persisted to disk — must re-derive via `sync` each CLI session (or cache encrypted with a passphrase if `--cache-dek` flag provided)

---

## Security Invariants

| Invariant | Enforced By |
|---|---|
| Server never sees plaintext DEK | DEK generated and stays client-side; only wrapped (encrypted) DEK transmitted |
| Server never sees plaintext secrets | Secrets encrypted client-side before upload |
| Server never sees private keys | Private keys generated and stored locally per device |
| Recovery key shown only once | Frontend: shown on creation, never stored server-side |
| Device must be approved before it can sync | `DeviceStatus.pending` guard in SyncService |
| Revoked devices cannot sync | `DeviceStatus.revoked` guard in SyncService |
| Password never stored plaintext | Argon2id hash only |
| Refresh tokens are rotated | Old token invalidated on each use |

---

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
PORT=3001
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### CLI (`~/.config/<app>/config.json`)

```json
{
  "apiUrl": "https://api.yourapp.com",
  "deviceId": "...",
  "defaultEnvironmentId": "..."
}
```

---

## Implementation Notes for Claude

1. **Crypto library**: Use `@noble/curves` for X25519 and `@noble/hashes` for HKDF/SHA256. These work in both browser (WebCrypto compatible) and Node.js. Use the native `crypto.subtle` WebCrypto API for AES-GCM operations in the browser.

2. **Self-wrap (Web UI own DEK)**: Since the Web UI can't ECDH with itself using a single keypair, derive the wrapping key directly: `wrapKey = HKDF(privateA, randomSalt, "self-wrap-v1")`. Store the salt alongside `wrappedDEK_A`.

3. **Approval ECDH**: When Web UI (Client A) wraps DEK for CLI (Client B): `sharedSecret = x25519.getSharedSecret(privateA, publicB)`. When CLI unwraps: `sharedSecret = x25519.getSharedSecret(privateB, publicA)`. Both yield the same shared secret.

4. **IndexedDB encryption**: Use `idb` or `idb-keyval` library. Derive IDB key from password: `PBKDF2(password, userSalt, 100000, SHA-256)` → AES-GCM key. Salt stored server-side or in localStorage (it's not secret).

5. **Pending device notification**: Implement as polling (`GET /api/devices/pending` every 5s) or SSE endpoint. Polling is simpler for initial implementation.

6. **RTK Query + crypto**: Crypto operations happen in component/hook layer before/after RTK Query calls. RTK Query only handles transport. Example pattern:
   ```ts
   const [upsertSecret] = useUpsertSecretMutation();
   const { dek } = useSelector(selectCrypto);
   
   const handleSave = async (key: string, value: string) => {
     const { encryptedValue, iv } = await encryptSecret(dek, value);
     await upsertSecret({ envId, key, encryptedValue, iv });
   };
   ```

7. **CLI DEK lifecycle**: On `cli secrets sync`, CLI fetches `wrappedDEK`, unwraps using its `privateKey`, and holds DEK in memory for the duration of the process. For commands that need the DEK, they must call sync first or read from a short-lived local encrypted cache.

8. **Monorepo**: Recommend `pnpm` workspaces or `nx` monorepo with packages: `apps/web`, `apps/api`, `apps/cli`, `packages/crypto` (shared crypto utilities), `packages/types` (shared TypeScript types).