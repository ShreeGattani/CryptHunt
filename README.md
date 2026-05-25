# CRYPTHUNT: The Creepypasta ARG Hacking Labyrinth

Crypthunt is an immersive, high-fidelity, full-stack Alternate Reality Game (ARG) and cyber-puzzle adventure. Built with an analog horror aesthetic (terminal glitch effects, neon glow grids, and CRT scanlines), players must decode cyber cryptograms, escape haunted server directories, and survive five levels of terrifying creepypasta lore.

---

## Tech Stack Matrix

- **Frontend Core**: Next.js 16 (App Router) + React 19 + TypeScript
- **Visual Design**: Tailwind CSS + Framer Motion + Lucide Icons
- **Backend Node**: Next.js Serverless API Routes
- **Database Engine**: MongoDB Atlas (Global Cloud Cluster)
- **Data ORM**: Prisma Client (v6.19.3 Engine for Native MongoDB Support)
- **Deployment Platform**: Vercel Cloud

---

## Global Synchronization Architecture

Crypthunt utilizes a custom-engineered synchronization and security mesh to ensure leaderboard integrity and real-time multiplayer consistency across the globe.

### 1. MongoDB Atlas Core
The database layer has been migrated from relational MySQL to MongoDB Atlas. This cloud-native document database enables ultra-low latency reads and writes, bypasses traditional TCP connection pooling limits, and supports global serverless scaling for modern web platforms.

### 2. Real-Time Cross-Browser Sync Engine
A background synchronization loop operates inside the core context of the application. Every 10 seconds, active clients communicate with `/api/auth/sync` using lightweight polling to automatically fetch, merge, and synchronize:
- Current level progress
- Active question indexes
- Total high scores
- Real-time ticking elapsed game timers

To optimize system resources and prevent sync drift, the engine employs a browser visibility gate (`document.visibilityState === "visible"`). Only the tab currently in active focus writes the updated clock duration to MongoDB, while background tabs safely pull and mirror the time.

### 3. Single-Session Terminal Override (Anti-Tampering)
To prevent concurrent dual-play cheating (where multiple players solve riddles simultaneously on the same account), Crypthunt enforces a single active login per ID globally:
- Upon login or registration, the server generates a unique `sessionToken` backed by a high-resolution timestamp.
- This token is saved to the user's document in MongoDB and returned to the client session.
- If the user logs in from a second terminal, a new token overrides the database record.
- The first terminal detects the mismatched token within seconds, immediately revokes access, terminates the ticking elapsed clock, purges local session keys, and kicks the user back to the decryption gate.

---

## Directory Structure

```text
Crypthunt/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts         # User authentication validation & session generator
│   │   │   ├── register/
│   │   │   │   └── route.ts         # User registration duplicate validator
│   │   │   └── sync/
│   │   │       └── route.ts         # Dual-channel session checking & time synchronization
│   │   └── quiz/
│   │       └── route.ts             # Level score upserts (POST) & Live rankings (GET)
│   ├── context/
│   │   └── GameContext.tsx          # Core ARG state engine, stateRef daemons & security gates
│   ├── dashboard/
│   │   └── page.tsx                 # Central Cyber Deck console with dynamic level selection
│   ├── data/
│   │   └── questions.ts             # Static levels configuration & creepypasta riddles
│   ├── leaderboard/
│   │   └── page.tsx                 # Real-time global ranking matrix with static dependency locks
│   ├── level/
│   │   └── [id]/
│   │       └── page.tsx             # Hacking terminal dashboard for active level questions
│   ├── globals.css                  # Core global styling, custom scanlines & glitch keyframes
│   ├── layout.tsx                   # HTML wrapper importing Share Tech & Orbitron cyber fonts
│   └── page.tsx                     # Gateway portal with dual Agent Register/Login forms
├── prisma/
│   └── schema.prisma                # Document schemas for MongoDB Atlas integration
├── package.json                     # Node.js manifest with custom version bounds
├── tailwind.config.ts               # Tailwind configurations, custom animations & fonts
└── .env                             # Environment secrets (DATABASE_URL credentials)
```

---

## The Hacking Levels

Players must solve 6 cryptograms for each creepypasta anomaly to unlock the exit hatch:
1. **Level 1: Slender Man** — Decode the pages in the dark woods.
2. **Level 2: Eyeless Jack** — Bypass the surgical operating metrics.
3. **Level 3: Ben Drowned** — Overcome the haunted cartridge codes.
4. **Level 4: The Puppeteer** — Sever the control strings.
5. **Level 5: Candle Cove** — Break the static pirate signals.

---

## Core Mechanics & Architecture

### 1. Unified State Engine (GameContext.tsx)
- Manages player active session parameters (username, score, level/question status, clock timer).
- Uses `isInitialized` loading state to safely recover active user sessions from `localStorage` without premature page-reload redirects.
- Restricts unauthenticated access from secure internal zones (Dashboard/Levels) and auto-redirects active users back to Dashboard if they try to access the root login portal.

### 2. Dual-Channel Database Synchronization
- **Live Mode**: Submits level progress and retrieves leaderboard entries dynamically over Prisma to a cloud MongoDB Atlas cluster.
- **Offline Fallback**: If the database is offline or unconfigured, the application gracefully stores users, enforces password credentials, and aggregates high scores inside the browser's `localStorage` (`crypthunt_local_users`) so you can fully play and test without database servers!

---

## Setup & Deployment Guide

### 1. Local Development Setup
1. Clone the repository and install all dependencies:
   ```bash
   npm install
   ```
   *(This automatically triggers `prisma generate` via postinstall to set up your type definitions)*

2. Copy the environment variables template and configure your connection string:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="mongodb+srv://<username>:<password>@cluster.mongodb.net/crypthunt?retryWrites=true&w=majority"
   ```

3. Synchronize your Prisma schema definitions to your MongoDB cluster:
   ```bash
   npx prisma db push
   ```

4. Launch the local cyber grid server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) on your local browser.

### 2. Vercel Cloud Deployment
1. Create a free shared cluster on **MongoDB Atlas**.
2. Set network access to `0.0.0.0/0` to allow Vercel Serverless requests.
3. Copy your MongoDB Atlas connection string and save it to `.env`.
4. Run `npx prisma db push` to generate indices on the cluster.
5. Push your code to your GitHub repository.
6. Log in to **Vercel.com**, import your repository, and define the environment variable:
   - **DATABASE_URL**: `your_mongodb_atlas_connection_string`
7. Click **Deploy**. Vercel will compile the application successfully and link your real-time leaderboard worldwide!
