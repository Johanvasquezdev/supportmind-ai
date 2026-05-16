# SupportMind AI

SupportMind AI is a multi-tenant customer support platform that answers customer questions using a company's own internal knowledge base.

Companies upload support documents, the backend chunks and embeds those documents, and chat responses are generated only from tenant-specific retrieved context.

## What This Repo Contains

- `frontend/` - Next.js + Tailwind application
- `backend/` - NestJS API with Prisma, Gemini, Pinecone, Clerk auth, and API-key auth
- `docker-compose.yml` - local development services
- `.env.example` - safe example environment variables

## Core Workflow

```text
Document upload
  -> chunk document text
  -> create embeddings
  -> upsert vectors with tenant metadata

User chat
  -> authenticate tenant
  -> embed user question
  -> query Pinecone with tenant filter
  -> build grounded prompt
  -> call Gemini
  -> save conversation and messages
```

## Architecture

```text
Frontend (Next.js)
  -> Backend (NestJS)
      -> Auth module
      -> Documents module
      -> RAG module
      -> AI module
      -> Chat module
      -> Billing module
      -> Prisma module

External services:
  -> Neon Postgres
  -> Pinecone
  -> Google AI Studio / Gemini
  -> Clerk
  -> Stripe
```

## Backend Modules

### Auth

- JWT auth for dashboard users
- API-key guard for widget requests
- Tenant ID is resolved by trusted auth context, not request body

### Documents

- Stores uploaded documents in Postgres
- Chunks document content
- Generates embeddings
- Stores document chunks and vector IDs

### Vector

- Uses Pinecone when configured
- Stores vectors with metadata:

```ts
{
  tenantId: string;
  text: string;
  documentId?: string;
  chunkIndex?: number;
}
```

All vector queries apply tenant filtering.

### RAG

- Converts user question to an embedding
- Queries the vector store
- Returns the top relevant tenant-scoped chunks

### AI

- Builds a grounded prompt from:
  - user message
  - retrieved context
  - conversation history
- Calls Gemini through the OpenAI-compatible chat API
- Refuses to answer when no relevant context exists
- Tracks token usage

### Chat

- Creates or continues conversations
- Loads recent history
- Calls RAG and AI services
- Saves user and assistant messages

### Billing

- Creates Stripe Checkout Sessions for subscriptions
- Uses Stripe Price IDs from environment variables
- Stores tenant/user IDs in Stripe metadata for webhook handling

## Tech Stack

| Area | Tech |
| --- | --- |
| Frontend | Next.js, React, Tailwind CSS |
| Auth UI | Clerk |
| Backend | NestJS, TypeScript |
| Database | Neon Postgres |
| ORM | Prisma |
| Vector DB | Pinecone |
| AI | Google AI Studio / Gemini |
| Billing | Stripe Checkout |

## Environment Variables

Never commit real `.env` files. They are ignored by Git.

Backend example:

```env
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
JWT_SECRET="generate-a-strong-secret"
JWT_EXPIRES_IN="7d"

CLERK_SECRET_KEY="your-clerk-secret-key"
DEFAULT_TENANT_ID="optional-dev-tenant-id"

GEMINI_API_KEY="your-google-ai-studio-api-key"
GEMINI_OPENAI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai/"
GEMINI_CHAT_MODEL="gemini-2.0-flash"

EMBEDDING_MODEL="gemini-embedding-001"
EMBEDDING_DIMENSIONS=768

# Optional OpenAI fallback
OPENAI_API_KEY=""
OPENAI_CHAT_MODEL=""

PINECONE_API_KEY="your-pinecone-key"
PINECONE_INDEX_NAME="supportmind"

STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_BASIC_PRICE_ID="price_basic_monthly"
STRIPE_PRO_PRICE_ID="price_pro_monthly"

PORT=3001
FRONTEND_URL="http://localhost:3000"
```

Frontend example:

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
```

## Pinecone Setup

Create an index manually:

- Name: `supportmind`
- Dimension: `768`
- Metric: `cosine`

The dimension must match `EMBEDDING_DIMENSIONS`.

## Stripe Setup

Create two recurring prices in Stripe and set:

- `STRIPE_SECRET_KEY`
- `STRIPE_BASIC_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`

The checkout page calls `POST /billing/checkout-session` and redirects to Stripe-hosted Checkout.

## Install

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Database

Push the Prisma schema to the configured database:

```bash
cd backend
npx prisma db push
```

Generate Prisma client:

```bash
npx prisma generate
```

## Run Locally

Backend:

```bash
cd backend
npm run start:dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Default URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## API Overview

### Documents

```http
POST /documents
POST /documents/upload
GET /documents
GET /documents/:id
DELETE /documents/:id
```

Dashboard endpoints use JWT auth.

### Chat

```http
POST /chat
```

Body:

```json
{
  "message": "What is the refund policy?",
  "conversationId": "optional-existing-conversation-id"
}
```

### Billing

```http
POST /billing/checkout-session
```

Body:

```json
{
  "plan": "basic"
}
```

## Security Notes

- Do not send `tenantId` from the client.
- Do not commit `.env`.
- Use `x-api-key` for widget API-key requests.
- Every database query should be tenant scoped.
- Every vector query must filter by `tenantId`.
- If secrets were pasted into chat or committed accidentally, rotate them.

## Tests

Backend:

```bash
cd backend
npm test -- --runInBand
```

Build:

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Current MVP Status

Implemented:

- Multi-tenant Prisma schema
- Document ingestion pipeline
- Gemini embeddings
- Pinecone vector service
- RAG retrieval service
- AI wrapper service
- Chat module
- Stripe Checkout Session endpoint
- JWT auth guard
- API-key auth guard
- Next.js landing page
- Clerk auth pages
- Dashboard shell

Still needed:

- Production tenant/user provisioning flow
- Real widget endpoint using API-key guard
- Stripe webhook persistence for subscription state
- Full production billing portal
- Deployment environment configuration

## License

MIT
