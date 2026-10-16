# Redis Caching Lab (MERN)

A small product store built with MongoDB, Express, React and Node, with **Redis** added between Express and MongoDB.
The product list route is already cached. Your lab tasks are in **LAB_TASKS.md**.

```
redis-mern-lab/
├─ backend/    Express + Mongoose + Redis   (http://localhost:5001)
└─ frontend/   React + Vite                 (http://localhost:5173)
```

## 1. Prerequisites

- Node.js 18 or newer
- A MongoDB Atlas connection string
- Redis, in one of these two ways (no Docker needed):

### macOS (local Redis)
```bash
brew install redis
brew services start redis
redis-cli ping          # should print PONG
```
Use `REDIS_URL=redis://localhost:6379`

### Windows (Redis Cloud, nothing to install)
1. Sign up at https://redis.io/try-free and create a **free** database.
2. On the database page, copy the **public endpoint** (`host:port`) and the **password** of the `default` user.
3. Your URL is `redis://default:<password>@<host>:<port>`
4. Install **Redis Insight** (free desktop app) and add the same database to it. Use its **Workbench** tab to type Redis commands like `GET`, `TTL`, `KEYS *`.

> If your Redis Cloud database has TLS enabled, start the URL with `rediss://` (two s).

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # Windows: copy .env.example .env
```
Edit `.env` and fill in `MONGO_URI` and `REDIS_URL`. Then:

```bash
npm run seed              # puts 8 sample products in MongoDB
npm run dev               # starts the API on port 5001
```
You should see:
```
✅ MongoDB connected
✅ Redis connected
🚀 API running on http://localhost:5001
```
If Redis is not running you will see a warning instead. The app still works, it just reads everything from MongoDB.

## 3. Frontend

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## 4. See the cache working

1. The page loads the product list: the badge shows **MISS · ~2000 ms**.
2. Click **Fetch products** again: **HIT · a few ms**.
3. Wait 60 seconds (the TTL) and fetch again: **MISS** again.
4. Watch the backend terminal: it prints `🐢 MISS` and `⚡ HIT` lines.

In `redis-cli` (Mac) or Redis Insight Workbench (Windows):
```
KEYS *
GET products:all
TTL products:all
DEL products:all
```
On a Mac, `redis-cli MONITOR` shows every command the backend sends, live.

## Settings in `.env`

| Variable | Meaning | Default |
|---|---|---|
| `SLOW_QUERY_MS` | Fake delay added to every MongoDB read | 2000 |
| `CACHE_TTL` | Seconds a cached value lives in Redis | 60 |

## Troubleshooting

- **Badge always shows BYPASS**: Redis is not connected. Check `REDIS_URL` and the Redis indicator at the top right of the page.
- **Port 5000 problems on Mac**: this project uses 5001 because macOS uses 5000 for AirPlay.
- **Re-seeded but old list still shows**: the old list is still cached. Run `DEL products:all` or wait 60 seconds.
- **Redis Cloud times out in the lab**: the college network may block the port. Try a mobile hotspot to confirm.
