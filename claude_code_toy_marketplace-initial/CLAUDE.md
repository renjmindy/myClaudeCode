# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 8080
npm run build      # Production build to dist/
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Local Supabase Development

```bash
supabase login
supabase db reset   # Apply migrations and seed data
supabase start      # Start local Supabase (dashboard at http://localhost:54323)

# Create a new migration
supabase migration new <migration_name>
supabase db reset

# Deploy migrations to remote
supabase link --project-ref $SUPABASE_PROJECT_REF
supabase db push
```

## Architecture

**Frontend**: React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix UI), React Router, TanStack React Query, React Hook Form + Zod

**Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)

The app auto-detects local vs. production Supabase based on hostname — see `src/integrations/supabase/client.ts`.

### Key Data Patterns

- **Server state** is managed via TanStack Query with custom hooks in `src/hooks/`
- **Database queries** use Supabase RPC functions (not direct table queries) when joining tables, to avoid Row-Level Security (RLS) permission issues
- **Real-time** messaging and presence use Supabase Realtime channels (`src/contexts/PresenceProvider.tsx`)
- **Image uploads** resize to 400×400px before uploading to the `product-images` storage bucket, organized as `{user_id}/{filename}`

### Routing (src/App.tsx)

| Path | Page |
|------|------|
| `/` | Index (landing) |
| `/categories` | Product listing browse |
| `/product/:id` | Product detail + messaging |
| `/create-listing` | Create new listing |
| `/create-listing/:id` | Edit existing listing |
| `/profile` | User profile, listings, saved items |
| `/conversations` | Message threads |
| `/conversations/:id` | Message thread detail |
| `/auth` | Sign in / sign up |

### Database Schema

Core tables: `profiles`, `products`, `product_images`, `conversations`, `participants`, `messages`

Key RPC functions:
- `get_public_products()` — search/sort product listings
- `get_public_product_detail()` — product with images
- `get_user_conversations()` — user's message threads
- `get_conversation_details()` — thread with participants
- `get_profile_names()` — name lookup without exposing PII

All tables use RLS. Products and images are publicly readable; messaging is restricted to conversation participants; storage uploads are restricted to the user's own folder.

## Conventions

- Use **camelCase** for all file names (e.g., `CreateListingForm.tsx`)
- Before writing a new Supabase query that joins tables, check if an existing RPC function already covers it
- Do not commit PII (e.g., email addresses) to the repo
