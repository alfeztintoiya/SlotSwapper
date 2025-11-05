# SlotSwapper

Peer‑to‑peer time‑slot swapping app. Users mark calendar events as "swappable" and trade time slots with others. Built to exercise auth, data modeling, transactional logic (implemented via optimistic concurrency), and frontend state management with real‑time updates.

> ⚠️ **Note:**  
> The originally published backend endpoint is not functional because it was deployed on a static hosting service (**Netlify**), which doesn’t support running long-lived Node.js or Express servers.  
> As a result, routes like `/api/health` will return a **404 Not Found** error.  
> To review the app end-to-end, please run the backend locally or deploy it to a Node-compatible host such as **Render**, **Heroku**, or **Fly.io**.  
> The frontend remains live on **Vercel**.


## Why this design

- Backend in JavaScript (Express + Mongoose): simple, familiar stack and easy to deploy on Render. Optimistic, conditional updates instead of MongoDB multi‑document transactions so it works on local standalone Mongo and free Atlas tiers.
- Frontend in TypeScript (Vite + React + MUI): fast DX, attractive UI, and strict typing on the client.
- Auth with HTTP‑only cookies (JWT): secure by default and works well with cross‑site deployments (Vercel frontend ↔ Render backend) using SameSite=None; Secure in production.
- Real‑time with Socket.IO: incoming swap requests and updates push instantly to the target user.
- Swap behavior: Only the time ranges of the two events are swapped on acceptance, not event ownership. Both events return to BUSY after completion.

## Tech stack

- Backend: Node.js, Express, Mongoose, JWT, bcryptjs, Socket.IO, Helmet, CORS
- Frontend: React, TypeScript, Vite, Material UI, Axios, socket.io‑client, dayjs
- Database: MongoDB (Local or Atlas)

## Repo layout

```
Backend/   # Express API + Socket.IO
Frontend/  # Vite + React (TS)
```

## Live demo

- Frontend (Vercel): https://slot-swapper-tau.vercel.app/
- Backend: currently not available



## Data model (MongoDB)

- User: { name, email, passwordHash }
- Event: { title, startTime, endTime, status, userId }
  - status: BUSY | SWAPPABLE | SWAP_PENDING
- SwapRequest: { requester, responder, mySlot, theirSlot, status }
  - status: PENDING | ACCEPTED | REJECTED

## API quick reference

Base URL: http://localhost:4000/api (change to your backend URL in production)

Auth

- POST /auth/signup { name, email, password } -> 200 user; sets auth cookie
- POST /auth/login { email, password } -> 200 user; sets auth cookie
- POST /auth/logout -> 200 { ok: true }
- GET /auth/me -> 200 user (requires cookie)

Events (auth required)

- GET /events -> list my events
- POST /events { title, startTime, endTime, status? } -> create
- PUT /events/:id { ...updates } -> update my event
- DELETE /events/:id -> delete my event
- PATCH /events/:id/status { status } -> set one of BUSY|SWAPPABLE|SWAP_PENDING

Swap (auth required)

- GET /swappable-slots -> list others' SWAPPABLE slots
- POST /swap-request { mySlotId, theirSlotId } -> create request; marks both SWAP_PENDING
- POST /swap-response/:requestId { accept:boolean }
  - accept=false: sets both back to SWAPPABLE, request=REJECTED
  - accept=true: swaps start/end times only; both -> BUSY, request=ACCEPTED
- GET /requests -> { incoming, outgoing } (each populated with slots)

Socket events (server->client)

- swap:request -> when you receive a new incoming request
- swap:update -> when a request is accepted/rejected

## Local setup (macOS/Linux/Windows)

Prereqs: Node 18+ and MongoDB (local) or MongoDB Atlas

1. Clone & install

```bash
# in repo root
cd "Backend" && npm install && cd ..
cd "Frontend" && npm install && cd ..
```

2. Environment files

Create `Backend/.env` (use `.env.example` as a guide):

```
PORT=4000
# local mongo:
MONGO_URI=mongodb://localhost:27017/slotswapper
# or Atlas (replace user, pass, cluster, appName):
# MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/slotswapper?retryWrites=true&w=majority&appName=<cluster>
JWT_SECRET=change_me
CORS_ORIGIN=http://localhost:5173
COOKIE_NAME=token
NODE_ENV=development
```

Create `Frontend/.env`:

```
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

3. Run

Open two terminals:

```bash
# terminal 1
cd "Backend" && npm start

# terminal 2
cd "Frontend" && npm run dev
```

4. Try it

- Open http://localhost:5173
- Sign up two users, create events for each, mark as SWAPPABLE, request a swap, and accept it from the other user.
- Real‑time updates will refresh the Requests page automatically.

Optional: quick API sanity checks

```bash
# health
curl -s http://localhost:4000/api/health

# signup
curl -i -c /tmp/u1.cookies -H 'Content-Type: application/json' \
  -d '{"name":"User1","email":"u1@example.com","password":"pass1234"}' \
  http://localhost:4000/api/auth/signup
```

## Deployment

### MongoDB Atlas

- Create free M0 cluster → DB user (password) → allow network access → copy SRV URI
- Put SRV URI in `MONGO_URI` on your backend host
- Optional: migrate local data with `mongodump`/`mongorestore`

### Backend on Render (recommended for Express)

- Root: `Backend/`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment:
  - `MONGO_URI` (Atlas SRV)
  - `JWT_SECRET`
  - `CORS_ORIGIN` (comma‑separated list allowed: e.g., `https://your-app.vercel.app,https://your-preview.vercel.app`)
  - `NODE_ENV=production`
- Cookies: in production and non‑localhost origins, the server sets `SameSite=None; Secure` automatically.

### Frontend on Vercel

- Root: `Frontend/`
- Build Command: `npm run build`
- Output Dir: `dist`
- Env:
  - `VITE_API_URL=https://your-api.onrender.com/api`
  - `VITE_WS_URL=https://your-api.onrender.com`



## Assumptions & edge cases

- We swap only times, not owners, on accept. Both events become BUSY.
- Concurrency: We avoid Mongo transactions to support local/Atlas free tiers. We use conditional updates and small, best‑effort rollbacks.
- Cookies: HTTP‑only cookies carry JWT. For cross‑site deployments, cookies use `SameSite=None; Secure`.
- Time zones: All times handled as ISO timestamps; frontend displays with dayjs (local time).
- Validation: Minimal; production apps should add stricter validation (Joi/Zod) and rate limiting.
- Security: No email verification or password reset in this challenge.


## Scripts

Backend

- `npm start` — start Express server

Frontend

- `npm run dev` — Vite dev server
- `npm run build` — production build (outputs to `Frontend/dist`)

---


