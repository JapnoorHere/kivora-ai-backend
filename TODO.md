# TODO

## 1. Rate Limiting

**Why:** Auth endpoints are open to brute force attacks. The AI generation endpoint has no cost protection — a single user can spam Gemini calls.

**Plan:**
- Install `express-rate-limit`
- Create `src/middlewares/rate-limit.middleware.js` with at least two tiers:
  - Strict: `POST /auth/login`, `POST /auth/signup` — e.g. 10 requests / 15 min per IP
  - Moderate: `POST /recipes/generate` — e.g. 20 requests / hour per user
- Apply in `recipe.routes.js` and `auth.routes.js`

---

## 2. Pagination on List Endpoints

**Why:** `GET /recipes` returns every recipe a user has ever created with no limit. Will become unusable as data grows.

**Plan:**
- Accept `page` (default 1) and `limit` (default 20, max 100) as query params
- Validate in a shared `paginationSchema` Joi schema
- Return response envelope: `{ items: [...], total, page, limit, totalPages }`
- Add `MESSAGES.RECIPE.FETCHED_ALL` still works — shape changes, not the message
- Apply to any future list endpoints too

---

## 3. Request Timeout

**Why:** A hung Gemini call keeps the HTTP connection open indefinitely, eventually exhausting the server's socket pool.

**Plan:**
- Option A (simple): `connect-timeout` middleware — kills the request after N seconds and sends a 503
- Option B (proper): Pass `AbortSignal` with a deadline to the Gemini SDK call in `ai.service.js` so the upstream call is actually cancelled, not just the response
- Option B is preferred — it stops billing on the Gemini side too
