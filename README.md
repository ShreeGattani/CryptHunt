# 💀 CRYPTHUNT: The Creepypasta ARG Hacking Labyrinth

**Crypthunt** is an immersive, high-fidelity, full-stack Alternate Reality Game (ARG) and cyber-puzzle adventure. Built with an analog horror aesthetic (terminal glitch effects, neon glow grids, and CRT scanlines), players must decode cyber cryptograms, escape haunted server directories, and survive five levels of terrifying creepypasta lore.

---

## 🚀 Tech Stack Matrix

- **Frontend Core**: [Next.js 16 (App Router)](https://nextjs.org/) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Visual Design**: [Tailwind CSS](https://tailwindcss.com/) + [Framer Motion](https://www.framer.com/motion/) + [Lucide Icons](https://lucide.dev/)
- **Backend Node**: Next.js Serverless API Routes
- **Database Engine**: [MySQL](https://www.mysql.com/)
- **Data ORM**: [Prisma Client](https://www.prisma.io/)
- **Deployment Platform**: [Vercel](https://vercel.com/) + [Railway](https://railway.app/) Cloud MySQL

---

## 📂 Full Directory Structure

```text
Crypthunt/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts         # User authentication validation & session generator
│   │   │   └── register/
│   │   │       └── route.ts         # User registration duplicate validator
│   │   └── quiz/
│   │       └── route.ts             # Level score upserts (POST) & Live rankings (GET)
│   ├── context/
│   │   └── GameContext.tsx          # Core ARG state engine, security gates & load safeguards
│   ├── dashboard/
│   │   └── page.tsx                 # Central Cyber Deck console with dynamic level selection
│   ├── data/
│   │   └── questions.ts             # Static levels configuration & creepypasta riddles
│   ├── leaderboard/
│   │   └── page.tsx                 # Real-time global ranking matrix with neon CRT loading
│   ├── level/
│   │   └── [id]/
│   │       └── page.tsx             # Hacking terminal dashboard for active level questions
│   ├── globals.css                  # Core global styling, custom scanlines & glitch keyframes
│   ├── layout.tsx                   # HTML wrapper importing Share Tech & Orbitron cyber fonts
│   └── page.tsx                     # Gateway portal with dual Agent Register/Login forms
├── prisma/
│   └── schema.prisma                # Relational schemas for MySQL database integration
├── package.json                     # Node.js manifest with custom Vercel postinstall hooks
├── tailwind.config.ts               # Tailwind configurations, custom animations & fonts
└── .env                             # Environment secrets (DATABASE_URL credentials)
```

---

## 💀 The Hacking Levels

Players must solve 6 cryptograms for each creepypasta anomaly to unlock the exit hatch:
1. **Level 1: Slender Man** — Decode the pages in the dark woods.
2. **Level 2: Eyeless Jack** — Bypass the surgical operating metrics.
3. **Level 3: Ben Drowned** — Overcome the haunted cartridge codes.
4. **Level 4: The Puppeteer** — Sever the control strings.
5. **Level 5: Candle Cove** — Break the static pirate signals.

---

## 🛡️ Core Mechanics & Architecture

### 1. Unified State Engine (`GameContext.tsx`)
- Manages player active session parameters (username, score, level/question status, clock timer).
- Uses `isInitialized` loading state to safely recover active user sessions from `localStorage` without premature page-reload redirects.
- Restricts unauthenticated access from secure internal zones (Dashboard/Levels) and auto-redirects active users back to Dashboard if they try to access the root login portal.

### 2. Dual-Channel Database Synchronization
- **Live Mode**: Submits level progress and retrieves leaderboard entries dynamically over Prisma to a cloud MySQL server.
- **Offline Fallback**: If the database is offline or unconfigured, the application gracefully stores users, enforces password credentials, and aggregates high scores inside the browser's `localStorage` (`crypthunt_local_users`) so you can fully play and test without database servers!

---

## ⚙️ Setup & Deployment Guide

### 1. Local Development Setup
1. Clone the repository and install all dependencies:
   ```bash
   npm install
   ```
   *(This automatically triggers `prisma generate` via postinstall to set up your type definitions)*

2. Copy the environment variables template and configure your connection string:
   Create a `.env` file in the root:
   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/crypthunt"
   ```

3. Synchronize your Prisma schema definitions to your MySQL server:
   ```bash
   npx prisma db push
   ```

4. Launch the local cyber grid server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) on your local browser.

### 2. Vercel & Railway Cloud Deployment
1. Create a free MySQL database on **Railway.app** or **Aiven.io**.
2. Copy the public database connection string.
3. Push your Prisma schemas directly to the cloud:
   ```bash
   npx prisma db push
   ```
4. Push your code to your GitHub repository.
5. Log in to **Vercel.com**, import your repository, and define the environment variable:
   - **DATABASE_URL**: `your_copied_public_connection_string`
6. Click **Deploy**. Vercel will compile the application successfully and link your real-time leaderboard worldwide!
