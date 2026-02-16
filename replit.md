# Flappy Bird Game

## Overview

A Flappy Bird browser game built with a full-stack TypeScript architecture. The frontend is a React single-page application that renders the game on an HTML5 Canvas, while the backend is an Express server. The project uses a monorepo structure with shared code between client and server. Currently, the game runs entirely client-side with canvas-based rendering, but the backend infrastructure (including database schema and storage layer) is in place for future features like leaderboards or user accounts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Directory Structure
- `client/` — React frontend (Vite-powered SPA)
- `server/` — Express backend (Node.js)
- `shared/` — Shared TypeScript types and database schema (used by both client and server)
- `migrations/` — Drizzle ORM database migration files
- `script/` — Build scripts

### Frontend
- **Framework**: React with TypeScript
- **Bundler**: Vite (with HMR in development via `server/vite.ts`)
- **Routing**: Wouter (lightweight client-side router)
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **State Management**: TanStack React Query for server state
- **Game Rendering**: HTML5 Canvas API (see `client/src/pages/game.tsx`) — the game logic (bird physics, pipe spawning, collision detection, scoring) is all handled in the game component using `requestAnimationFrame`
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend
- **Framework**: Express 5 (with `http.createServer` wrapper)
- **Language**: TypeScript, run with `tsx` in development
- **API Pattern**: All API routes should be prefixed with `/api` and registered in `server/routes.ts`
- **Storage Layer**: Abstracted via `IStorage` interface in `server/storage.ts`. Currently uses in-memory storage (`MemStorage`). Can be swapped to a database-backed implementation.
- **Static Serving**: In production, serves the built Vite output from `dist/public`. In development, Vite dev server middleware handles client assets with HMR.

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` — currently has a `users` table with `id` (UUID), `username`, and `password`
- **Validation**: Uses `drizzle-zod` to generate Zod schemas from Drizzle table definitions
- **Migrations**: Managed via `drizzle-kit push` (schema push approach, not migration files)
- **Connection**: Requires `DATABASE_URL` environment variable pointing to a PostgreSQL database
- **Session Store**: `connect-pg-simple` is included as a dependency for PostgreSQL-backed sessions

### Build Process
- **Development**: `npm run dev` — runs `tsx server/index.ts` which starts Express with Vite middleware
- **Production Build**: `npm run build` — runs `script/build.ts` which builds the client with Vite and bundles the server with esbuild (output format: CJS)
- **Production Start**: `npm start` — runs `node dist/index.cjs`
- **Type Checking**: `npm run check` — runs `tsc` with no emit

## External Dependencies

### Core Runtime
- **PostgreSQL** — Primary database (connected via `DATABASE_URL` env var)
- **Drizzle ORM** — Database ORM and query builder
- **Express 5** — HTTP server framework

### Frontend Libraries
- **Radix UI** — Headless UI primitives (full suite: dialog, dropdown, tabs, tooltip, etc.)
- **shadcn/ui** — Pre-styled component library built on Radix
- **TanStack React Query** — Data fetching and caching
- **Embla Carousel** — Carousel component
- **Recharts** — Chart library (via chart component)
- **react-day-picker** — Date picker component
- **Wouter** — Client-side routing
- **Lucide React** — Icon library

### Dev/Build Tools
- **Vite** — Frontend dev server and bundler
- **esbuild** — Server bundling for production
- **Tailwind CSS** — Utility-first CSS
- **TypeScript** — Type safety across the stack
- **@replit/vite-plugin-runtime-error-modal** — Runtime error overlay for development