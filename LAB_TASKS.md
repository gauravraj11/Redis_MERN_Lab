# Lab Tasks: Redis Caching in MERN

Finish the setup in README.md first. You should see **MISS** on the first load and **HIT** on the second.

Write down your observations (badge, time in ms, Redis commands you ran) for each scenario.

---

## Warm-up (10 min)

In `redis-cli` or Redis Insight Workbench, run:
```
SET greeting "hello" EX 30
GET greeting
TTL greeting
```
Wait 30 seconds, then run `GET greeting` again. What do you get and why?

---

## Scenario 1: The missing product (cache invalidation)

**Problem**
1. Click **Fetch products** until the badge shows **HIT**.
2. Add a new product using the form.
3. The list reloads, but your new product **is not there**. Fetch again: still missing.
4. Wait about 60 seconds and fetch: now it appears.

**Questions**
- Why did the new product not appear at once, even though it is saved in MongoDB?
- Why did it appear after about 60 seconds?

**Your task**
In `backend/routes/products.js`, fix the `POST` and `DELETE` routes so the list is always correct right after a change.

**Hint**: after writing to MongoDB, remove the old cached list. Which Redis command deletes a key? What is the key's name?

**Expected result**
- Add a product: it appears immediately, and the list request shows **MISS**.
- Fetch again: **HIT**, and the new product is still there.
- Delete a product: it disappears immediately.

---

## Scenario 2: Cache a single product (per-item caching + TTL)

**Problem**
Click **View** on any product. The detail panel always shows **NONE · ~2000 ms**, every time.

**Your task**
In the `GET /:id` route, apply the same cache-aside pattern used in `GET /`:
- Key name: `product:<id>`, for example `product:66f1c2...`
- Expiry: 60 seconds
- Set the `X-Cache` header to `HIT` or `MISS`

**Verify**
1. Click **View** twice on the same product: **MISS** then **HIT**.
2. In Redis, run `KEYS product:*` and `TTL product:<id>`. Watch the number go down.
3. When `TTL` returns `-2`, click **View** again. What badge do you see?

**Think about it**: if a product is deleted, its `product:<id>` key is still in Redis. How would you fix that? (Bonus: fix it.)

---

## Scenario 3: Stop the spammer (rate limiting)

**Problem**
Click **Send 6 quick requests**. All six succeed. A real API should limit how often one client can call it.

**Your task**
Complete `backend/middleware/rateLimiter.js` so that one IP can make **at most 5 requests per minute** to `/api/products`.
- Use `INCR` on a key like `rate:<ip>`
- When the counter is created (value 1), set `EXPIRE` to 60 seconds
- If the counter is above 5, reply with status **429** and `{ "message": "Too many requests, try again in a minute" }`
- If Redis is not connected, let the request through

**Verify**
1. Click **Send 6 quick requests**: by the 6th request (sooner if you fetched in the last minute) the request log shows **429** in red, and an error message appears.
2. In Redis, run `GET rate:<your ip>` and `TTL rate:<your ip>` (find the key with `KEYS rate:*`).
3. After the TTL reaches `-2`, requests work again.

---

## Submit

1. Screenshots of the request log for each scenario.
2. Your changed `products.js` and `rateLimiter.js`.
3. Answers to the questions above, in your own words.
