# @toolkit-faturamento/worker

Long-running Node process for PDF/OCR work: calls Convex via **`ConvexHttpClient`** using **Custom JWT** auth (`proc.worker.*`), runs `pdftotext` / `tesseract` / highlighting (planned), packaged as a Docker image with native OCR dependencies.

## Convex worker auth (Custom JWT)

1. Generate keys and paste printed env lines:

   ```bash
   npm run generate-worker-keys -w @toolkit-faturamento/worker
   ```

2. **Convex dashboard** (same deployment as `npx convex dev`): add `WORKER_JWT_ISSUER`, `WORKER_JWT_SUBJECT`, `WORKER_JWT_APPLICATION_ID` (optional), and `WORKER_SERVICE_JWKS_DATA_URI`. Either **set all three logical vars (`issuer`, JWKS URI, `subject`) or omit all** — partial config fails `auth.config.ts`.

3. **`apps/server/.env.local`**: mirror issuer / subject / application ID / JWKS data URI for local `convex dev`.

4. **`apps/worker/.env.local`**: set `WORKER_JWT_ISSUER`, `WORKER_JWT_SUBJECT`, `WORKER_JWT_APPLICATION_ID`, `WORKER_JWT_PRIVATE_KEY_PKCS8` (PKCS8 PEM with `\n` escapes from the script). Optional: `WORKER_JWT_EXPIRATION_SECONDS` (default `3600`).

Use **`proc.worker.query` / `mutation` / `action`** for Convex endpoints that must only accept this JWT (`iss` + `sub` checked). Clerk users use **`proc.protected.*`**.

## Stack

- Node.js 25, TypeScript
- `tsup` (bundle to `dist/`)
- `convex` (`ConvexHttpClient`), `jose` (RS256 JWT mint)
- AWS SDK (`@aws-sdk/client-secrets-manager`) for secrets from SSM
- Runtime image: `tesseract-ocr`, `poppler-utils`, `libtiff6` (see `Dockerfile`)

## Commands

From repo root:

```bash
npx turbo dev --filter=@toolkit-faturamento/worker
npx turbo build --filter=@toolkit-faturamento/worker
npx turbo lint --filter=@toolkit-faturamento/worker
```

From `apps/worker`:

```bash
npm run dev
npm run build
npm run lint
npm run generate-worker-keys
```

**Docker (from repository root)**

```bash
docker build -f apps/worker/Dockerfile -t toolkit-faturamento-worker .
```

Local compose: `apps/worker/docker-compose.yml`.

## Dependencies

**Runtime**

- `@aws-sdk/client-secrets-manager`, `@toolkit-faturamento/server`, `convex`, `dotenv`, `jose`, `zod`

**Dev**

- `@toolkit-faturamento/config`, `tsup`, `eslint`, `typescript-eslint`

**Peer**

- `typescript`

**Environment**

- `CONVEX_URL`
- Worker JWT: `WORKER_JWT_ISSUER`, `WORKER_JWT_SUBJECT`, `WORKER_JWT_APPLICATION_ID`, `WORKER_JWT_PRIVATE_KEY_PKCS8`, optional `WORKER_JWT_EXPIRATION_SECONDS`
- `HMAC_SECRET` or `AWS_SSM_HMAC_SECRET_NAME` + `AWS_REGION`; optional `AWS_SSM_WORKER_JWT_PRIVATE_KEY_NAME` (production PEM in a separate secret)
- Turbo lists worker JWT vars in root `turbo.json` `globalEnv`

**Deployment**

CI builds the image, pushes to **Amazon ECR**, then deploy job on **EC2** pulls the image and restarts the configured systemd unit (`WORKER_IMAGE`).
