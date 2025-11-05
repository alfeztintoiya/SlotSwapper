# SlotSwapper Backend

Run locally

```bash
npm install
npm run start
```

Environment variables (see `.env.example`):

- PORT (default 4000)
- MONGO_URI (e.g. mongodb://localhost:27017/slotswapper)
- JWT_SECRET
- CORS_ORIGIN (e.g. http://localhost:5173)
- COOKIE_NAME (default token)

Notes

- No MongoDB multi-document transactions are required. Swap logic uses optimistic atomic updates, so it works on standalone MongoDB (no replica set needed).
- If your frontend runs on a different origin (host/port), set CORS_ORIGIN to exactly match it so cookies are sent.
- Socket.IO uses cookies to identify the user; ensure the browser includes cookies (we set SameSite=Lax and credentials=true).

## Using MongoDB Atlas (for deployment)

1. Create an Atlas cluster

- Go to https://www.mongodb.com/atlas and create/sign in.
- Create a Project, then a free M0 cluster (pick a region close to your server).

2. Create a database user

- Database Access → Add new database user → Authentication Method: Password.
- Role: readWriteAnyDatabase (or readWrite on your DB). Save username/password.
- If your password has special characters, URL-encode it before putting in the URI.

3. Allow network access

- Network Access → Add IP address.
  - For testing/Render/Heroku with changing egress IPs, you can use 0.0.0.0/0 temporarily.
  - For production, restrict to your server’s static egress IP(s) for better security.

4. Get the connection string

- Connect → Drivers → Node.js. Copy the SRV string. Example:
  `mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/slotswapper?retryWrites=true&w=majority&appName=<cluster>`

5. Put it in your environment

- Set `MONGO_URI` in your hosting provider’s env vars (Render/Heroku/etc.) and in your local `.env` if testing.
- Do not commit credentials to git. Use `.env` and provider secret management.

6. Start the app

- The backend uses `env.MONGO_URI` automatically. If connection succeeds, you’ll see `MongoDB connected` in logs.

Optional (migrate local data to Atlas)

- Install MongoDB Database Tools (macOS: `brew install mongodb-database-tools`).
- Dump local DB: `mongodump --uri "mongodb://localhost:27017/slotswapper" --out dump`.
- Restore to Atlas: `mongorestore --uri "<your_atlas_uri>" dump`.

Production cookie/CORS hints

- If frontend is on a different domain than backend, set `CORS_ORIGIN` to that exact origin (or multiple, comma-separated).
- For cross-site cookies in production (e.g., Render API + Vercel web), ensure `NODE_ENV=production`. The app will automatically set cookies to `SameSite=None; Secure` when the origin isn’t localhost. Socket.IO CORS is aligned with `CORS_ORIGIN`.

## Deploying on Render (Backend)

1. Create a Web Service

- Link your repository and set the root to `Backend/`.
- Build Command: `npm install`
- Start Command: `npm start`

2. Environment Variables

- `PORT` (Render provides `$PORT`; our server listens on `env.PORT`. You can set `PORT` to `4000` or to `$PORT` and keep defaults.)
- `MONGO_URI` (your Atlas SRV connection string)
- `JWT_SECRET` (long random string)
- `CORS_ORIGIN` (e.g., `https://your-app.vercel.app,https://your-preview-url.vercel.app`)
- `NODE_ENV=production`

3. Networking

- If Atlas is IP-restricted, add Render’s egress IP or allow all temporarily for testing.

## Deploying on Vercel (Frontend)

1. Import the repo and set project root to `Frontend/`.

- Build Command: `npm run build`
- Output Directory: `dist`

2. Environment Variables

- `VITE_API_URL` → `https://your-api.onrender.com/api`
- `VITE_WS_URL` → `https://your-api.onrender.com`

3. Redeploy and test

- After deploy, login and swapping should work cross-site with cookies and Socket.IO.
