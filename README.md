<h1 align="center">VISFIT — Premium Fitness & Nutrition Platform</h1>

> Fitness, nutrition and progress platform. Set a goal and target date, train and eat daily, watch your countdown and progress update automatically. Log what you ate, run guided workouts, share progress with friends.

**VisFit-specific additions**: cinematic landing page, goal/countdown dashboard, an `ImageService` (Unsplash → Pexels, no local placeholder fallback) powering all photography with attribution, USDA FoodData Central nutrition search, an Activity tab (workout/weight feed, lightweight challenges, OpenStreetMap route explorer), and a dependency-free body-progress visual (SVG, in place of a heavy 3D engine — see `src/components/body-silhouette.tsx`).

**MIT · PWA · Mobile-first**

---

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components, Turbopack)
- **Tailwind CSS v4** + custom UI primitives (iOS-style grouped list, dark / light / system)
- **Auth.js v5** (email + password)
- **Turso** (libSQL) + **Drizzle ORM**
- **next-intl** (English)
- **next-themes** (dark / light / system)
- **PWA** (manifest, service worker, offline shell, apple-touch-icon)

---

## Features

### Nutrition

- **Manual meal log** — enter calories and macros (P/C/F) directly, or search **USDA FoodData Central** to pull verified nutrition data for a food into your entry.
- **Editing** — adjust time, date, calories and macros for any meal manually.
- **Water tracking** — dashboard widget with +200 / +500 / +750 ml quick buttons, undo last entry.

### Workouts

- **37 home-only exercises** — bodyweight only, categorized (chest / back / legs / core / arms / shoulder / cardio / full body).
- **Interval timer** — work / rest phases, audible beep, screen wake lock.
- **Manual picker** — pick exercises yourself and build a session.

### Tracking

- **Profile**: height, weight, age, sex → **BMI auto-computed** → goal (lose / maintain / gain) auto-selected.
- **Activity level** — derived from completed workouts in the last 7 days.
- **BMR (Mifflin-St Jeor)** + **TDEE** + daily calorie target — all automatic.
- **Weight history** — log entries, trend bar chart, delta vs start.

### Social

- **Username search** — find friends by `@username`, send/accept requests.
- **Weekly summary sharing** — workout count + average calories (on by default).
- **Privacy toggles** — Settings lets you opt in to share weight / meals / water.

### Misc

- **Light + dark themes** with system support.
- **PWA** — add to home screen, offline shell, iOS safe-area.

---

## Setup

### 1. Clone

```bash
git clone <your-repo-url> visfit
cd visfit
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable                                  | Where to get it                                                 |
| ----------------------------------------- | --------------------------------------------------------------- |
| `AUTH_SECRET`                             | run `npx auth secret`                                           |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | https://turso.tech                                              |
| `UNSPLASH_ACCESS_KEY`                     | https://unsplash.com/developers — primary photography provider  |
| `PEXELS_API_KEY`                          | https://www.pexels.com/api/ — photography fallback              |
| `USDA_API_KEY`                            | https://fdc.nal.usda.gov/api-key-signup.html — nutrition search |

All image/nutrition keys are optional: if unset, `ImageService` falls back gracefully (Unsplash → Pexels) and, if neither provider is configured or available, the UI shows a clean empty state instead of an image — never a fabricated placeholder tile. USDA search simply returns no results instead of erroring.

### 3. Database schema + exercise catalog

```bash
npm run db:push
npm run db:seed-exercises
```

### 4. Run

```bash
npm run dev
```

http://localhost:4000 → opens the app directly.

---

## Vercel Deploy

1. Import project: https://vercel.com/new
2. Add the environment variables listed above.
3. Deploy.

---

## Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (app)/                 # authenticated pages
│   │   │   ├── page.tsx           # dashboard (today)
│   │   │   ├── log/               # add meal
│   │   │   ├── meals/[id]/edit/   # edit meal
│   │   │   ├── history/           # past meals
│   │   │   ├── workouts/          # workouts (list + new + active)
│   │   │   ├── weight/            # weight history
│   │   │   ├── friends/           # friends (list + search + detail)
│   │   │   ├── profile/           # user profile
│   │   │   └── settings/          # theme, language, privacy
│   │   └── signin/                # sign-in screen
│   ├── api/                       # REST endpoints
│   └── layout.tsx                 # root (delegates to locale layout)
├── auth.ts                        # Auth.js v5 config
├── components/                    # UI components
├── db/                            # schema, client, queries, seed
├── i18n/                          # routing, request, messages
├── lib/
│   ├── calories.ts                # BMR/TDEE/BMI/goal/activity math
│   ├── stats.ts                   # daily aggregation helpers
│   └── utils.ts
└── proxy.ts                       # i18n middleware (Next.js 16)
```

---

## API Endpoints

| Path                                   | Method                   | Description               |
| -------------------------------------- | ------------------------ | ------------------------- |
| `/api/auth/[...nextauth]`              | GET/POST                 | NextAuth handlers         |
| `/api/meals`                           | GET, POST                | List / save meal          |
| `/api/meals/[id]`                      | GET, PATCH, DELETE       | Single meal CRUD          |
| `/api/water` / `/api/water/[id]`       | GET, POST, DELETE        | Water tracking            |
| `/api/weight` / `/api/weight/[id]`     | GET, POST, DELETE        | Weight entries            |
| `/api/profile`                         | GET, PATCH               | Profile + derived targets |
| `/api/exercises`                       | GET                      | Exercise catalog          |
| `/api/workouts` / `/api/workouts/[id]` | GET, POST, PATCH, DELETE | Workout session CRUD      |
| `/api/users/search`                    | GET                      | Username search           |
| `/api/users/[username]/summary`        | GET                      | Friend weekly summary     |
| `/api/friends` / `/api/friends/[id]`   | GET, POST, PATCH, DELETE | Friendships               |
| `/api/privacy`                         | GET, PATCH               | Sharing toggles           |

---

## NPM Scripts

```bash
npm run dev                # next dev -p 4000
npm run build              # production build
npm run start              # next start -p 4000
npm run lint               # eslint
npm run db:push            # drizzle-kit push (sync schema → Turso)
npm run db:generate        # drizzle-kit generate migrations
npm run db:studio          # drizzle-kit studio
npm run db:seed-exercises  # seed/update exercise catalog
npm run auth:secret        # generate AUTH_SECRET
```

---

## Security

- `.env.local` is never committed (gitignored).
- Rotate any tokens leaked through chat / screenshots (Turso, Google Cloud Console).
- DB enforces PK + FK cascade, unique constraints (email, username); zod input validation on every POST/PATCH.

---

## License

MIT — see [LICENSE](./LICENSE).
