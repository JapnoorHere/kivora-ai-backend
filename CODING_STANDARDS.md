# Coding Standards — Kivora AI Backend

## Module Structure

Every feature lives under `src/modules/<feature>/` with exactly these files:

```
src/modules/<feature>/
  <feature>.model.js       Mongoose schema + model export
  <feature>.validator.js   Joi schemas for request validation
  <feature>.service.js     Business logic — pure async functions, no req/res
  <feature>.controller.js  HTTP layer — extract from req, call service, send response
  <feature>.routes.js      Express Router — middleware wiring and route registration
```

New routes are mounted in `src/routes/index.js`.

---

## Error Handling

Throw errors from the service layer using semantic factory functions — never construct raw `Error` objects or use `res.status().json()` for errors.

```js
import { badRequest, notFound, unauthorized, forbidden, conflict, internalServer } from '../../errors/index.js';
import { MESSAGES, ERROR_CODES } from '../../constants/index.js';

throw conflict(MESSAGES.AUTH.EMAIL_TAKEN, ERROR_CODES.AUTH_EMAIL_TAKEN);
throw notFound(MESSAGES.RECIPE.NOT_FOUND(id), ERROR_CODES.RECIPE_NOT_FOUND);
```

All errors flow through the global handler in `src/errors/error.handler.js`. Non-operational errors (unhandled exceptions) are masked to a generic 500 in production.

**Error factory signatures:**
```js
badRequest(message, errors, code)  // 400 — use for validation fails with structured errors array
notFound(message, code)            // 404
unauthorized(message, code)        // 401
forbidden(message, code)           // 403
conflict(message, code)            // 409
internalServer(message, code)      // 500
```

`createError` is an internal factory — never import it into services or controllers.

---

## Response Shape

**Success:**
```json
{ "success": true, "message": "...", "data": { ... } }
```

**Error:**
```json
{ "success": false, "message": "...", "code": "ERROR_CODE", "errors": [...], "requestId": "abc123" }
```

Use `sendSuccess(res, message, data?, statusCode?)` from `src/utils/api-response.js`. Never call `res.status().json()` directly in controllers.

---

## Constants

Never hardcode strings or status codes in services, controllers, or middleware.

| Constant     | Location                       | Usage                              |
|--------------|--------------------------------|------------------------------------|
| `HTTP_STATUS` | `src/constants/http-status.js` | Status codes (`HTTP_STATUS.CREATED`) |
| `MESSAGES`   | `src/constants/messages.js`    | All user-facing strings             |
| `ERROR_CODES`| `src/constants/messages.js`    | Machine-readable error identifiers  |

All three are re-exported from `src/constants/index.js`.

---

## Validation

Schemas live in `<feature>.validator.js` using Joi. Apply with the `validate` middleware:

```js
router.post('/signup', validate(signupSchema), authController.handleSignup);
router.get('/:id', validateObjectId('id'), recipeController.handleGetRecipeById);
```

- `validate(schema, source?)` — validates `req.body` by default; supports `'query'` and `'params'`
- Options: `abortEarly: false`, `stripUnknown: true`
- On failure: throws `badRequest` with structured `errors: [{ field, message }]`
- `validateObjectId(paramName)` — validates route params are valid MongoDB ObjectIds before hitting the service

---

## Authentication

JWT is stored in an HttpOnly cookie (`token`) — never returned in the response body.

```js
router.use(protect);  // applies to all routes below
```

The `protect` middleware (`src/middlewares/auth.middleware.js`) verifies the token, rejects revoked sessions, and attaches the full user document (password excluded) to `req.user`.

Cookie options come from `buildAuthCookieOptions(token)` in `src/utils/cookie.util.js` — never hand-roll them at a call site. `httpOnly: true`, `secure: true` in production, `sameSite: 'none'` in production / `'lax'` in development, and `expires` pinned to the token's own `exp` claim so cookie and token always die together.

Because the cookie is HttpOnly, the browser cannot inspect its own session — `GET /auth/me` (behind `protect`) is the only way a client can learn whether it is still signed in. Clients must never infer auth state from local storage.

Every token carries a `jti`. Logout writes it to the `RevokedToken` denylist (`src/modules/auth/auth.model.js`), which self-expires via a TTL index on `expiresAt`, so signing out kills that session immediately without touching the user's other devices.

Pre-auth routes are IP rate limited (`loginLimiter`, `signupLimiter`); authenticated cost-bearing routes are user-keyed (`aiGenerationLimiter`).

---

## Controllers

Thin by design — extract from `req`, call service, return response. No business logic.

```js
export const handleGenerateRecipe = asyncHandler(async (req, res) => {
  const recipe = await recipeService.createAILedRecipe(req.body, req.user._id);
  return sendSuccess(res, MESSAGES.RECIPE.GENERATED, recipe, HTTP_STATUS.CREATED);
});
```

Always wrap in `asyncHandler` from `src/utils/async-handler.js` — eliminates try/catch boilerplate.

---

## Mongoose Patterns

- Use `{ timestamps: true, versionKey: false }` on all schemas — automatic `createdAt`/`updatedAt`, no `__v` noise
- Use `.lean()` on all read queries — returns plain JS objects, not Mongoose documents
- Use `serialize(doc)` / `serializeMany(docs)` from `src/utils/serialize.js` after every query — converts `_id` to `id`, strips internal fields
- Use compound indexes for common query patterns — not single-field indexes that get superseded

```js
// Read pattern
const recipes = await Recipe.find({ createdBy: userId }).sort({ createdAt: -1 }).lean();
return serializeMany(recipes);

// Write pattern
const recipe = await Recipe.create({ ...data, createdBy: userId });
return serialize(recipe.toObject());
```

---

## Request Context (Correlation ID)

Every request gets a `requestId` (UUID) via `attachRequestContext` middleware in `app.js`. It is:
- Attached to `req.requestId`
- Sent as `X-Request-Id` response header
- Automatically included in every log line via `AsyncLocalStorage`
- Included in error responses as `requestId`

The context is managed by `src/utils/request-context.js` using Node's built-in `AsyncLocalStorage`.

---

## Logging

Use the custom logger from `src/utils/logger.js` — never `console.log` directly.

```js
import { logInfo, logWarn, logError, logDebug, logHttp } from '../../utils/logger.js';
```

| Function   | Color  | Use for                                      |
|------------|--------|----------------------------------------------|
| `logInfo`  | Green  | Server start, DB connection, lifecycle events |
| `logWarn`  | Yellow | Recoverable issues, degraded state           |
| `logError` | Red    | Errors — includes stack trace automatically  |
| `logDebug` | Cyan   | Development-only debugging (suppressed in prod) |
| `logHttp`  | Cyan   | Incoming HTTP requests                       |

Every log line includes: timestamp, requestId (when in a request context), caller file + line number.

---

## Security

Applied in `app.js` in this order:

1. `helmet()` — sets secure HTTP headers (CSP, HSTS, X-Frame-Options, etc.)
2. `cors({ origin: config.cors.origins })` — allowlist from `ALLOWED_ORIGINS` env var
3. `verifyOrigin` — CSRF guard: rejects non-safe methods whose `Origin` is outside the allowlist. CORS alone does not cover this, since a cross-site `<form>` POST is a "simple" request that arrives before any preflight
4. `express.json({ limit: '10kb' })` — hard cap on request body size. **JSON only, deliberately** — adding an urlencoded parser would re-open the cross-site form-POST path that `verifyOrigin` exists to close
5. `mongoSanitize.sanitize()` — strips MongoDB operators (`$`, `.`) from req.body and req.params (`req.query` is a getter-only in Express 5 and cannot be replaced)
6. `attachRequestContext` — assigns correlation ID to every request

`app.set('trust proxy', 1)` in production so IP-keyed rate limits see the real client address rather than the reverse proxy's.

---

## Config

All environment variables are Joi-validated at startup in `src/config/env.config.js`. Missing required vars throw immediately — the server never starts in a broken state.

Access config via the structured `config` object:

```js
import { config } from '../../config/env.config.js';

config.port
config.env           // 'development' | 'production' | 'test'
config.db.uri
config.gemini.apiKey
config.jwt.secret
config.jwt.expiresIn
config.cors.origins  // string[] parsed from ALLOWED_ORIGINS
```

Never read `process.env` directly outside of `env.config.js`.

---

## Graceful Shutdown

`server.js` handles both `SIGTERM` (container stop) and `unhandledRejection`. On either signal:
1. HTTP server stops accepting new connections (`server.close`)
2. Mongoose disconnects cleanly
3. Process exits 0

`uncaughtException` is fatal — logs and exits immediately.

---

## ESM

- `"type": "module"` in `package.json` — all files are ES modules
- All imports must use explicit `.js` extensions
- No CommonJS (`require`, `module.exports`)

---

## Code Style

- **No narrating comments.** Only comment when the WHY is non-obvious (a security decision, a subtle invariant, a workaround). Never comment what the code already says.
- **No JSDoc blocks** that just restate the function signature.
- Use `HTTP_STATUS.*` constants — never raw numbers.
- Use `MESSAGES.*` constants — never inline strings.
- Use `ERROR_CODES.*` — never inline strings for error codes.
