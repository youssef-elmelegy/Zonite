# Contract: HTTP Response Envelope

**Applies to**: every HTTP response from `apps/backend`, without exception.

## Shape

### Success (2xx)

```json
{
  "code": 200,
  "success": true,
  "message": "OK",
  "data": { "...domain payload..." },
  "timestamp": "2026-04-22T10:00:00.000Z"
}
```

### Error (4xx / 5xx)

```json
{
  "code": 400,
  "success": false,
  "message": "Validation failed",
  "error": "validation_failed",
  "data": {
    "fieldErrors": {
      "email": ["email must be a valid email"]
    }
  },
  "timestamp": "2026-04-22T10:00:00.000Z"
}
```

## Invariants (verifiable)

1. `success` is `true` ⟺ HTTP status is 2xx.
2. `code` always mirrors the HTTP status code of the response.
3. `timestamp` is ISO-8601 UTC, millisecond precision.
4. `data` is **always present** on success (`null` is allowed when the endpoint has nothing to return, e.g., `204`-shaped logout). `data` is **optional** on error.
5. `error` (category token) is always present on error; machine-readable snake_case. Allowed values in Phase 2: `"validation_failed"`, `"unauthorized"`, `"forbidden"`, `"not_found"`, `"conflict"`, `"rate_limited"`, `"server_error"`. New categories require a Spek update.
6. `message` is a human-readable string; never contains stack traces, file paths, or SQL fragments.
7. The envelope is produced by exactly one of:
   - `successResponse<T>(data, message?, code?)` — in controllers
   - `errorResponse(message, code?, error?, data?)` — in the global exception filter
     No controller may hand-construct the envelope object literal.

## How the envelope reaches the wire

```text
Controller handler
   │
   ├── return successResponse(data, "OK")        ─────┐
   │                                                  │
   └── throw HttpException / domain error             │
            │                                          │
            ▼                                          │
     AllExceptionsFilter                               │
            │                                          │
            └── return errorResponse(msg, code, err) ──┤
                                                        │
                                                        ▼
                                                 Express response body
```

## Tests (Phase 2 e2e suite)

A helper in `test/envelope.assert.ts` is applied to every response:

```ts
export function assertEnvelope(res: request.Response) {
  expect(res.body).toMatchObject({
    code: expect.any(Number),
    success: expect.any(Boolean),
    message: expect.any(String),
    timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
  });
  if (res.body.success) {
    expect(res.body).toHaveProperty('data');
  } else {
    expect(res.body).toHaveProperty('error');
  }
}
```

The smoke e2e calls this on every request it makes (~8 per run). SC-002 ("100 % of registered endpoints return the shared envelope") is enforced by this assertion + CI.
