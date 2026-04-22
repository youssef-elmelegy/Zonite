# Contract: `GET /api/health`

**Feature**: Foundation & Project Setup (Phase 0)
**Owner**: `apps/backend/src/modules/health/`
**Stability**: Stable from Phase 0 forward. Breaking changes require a constitution
amendment (this endpoint is the canonical smoke test for the Sikka response envelope).

## Purpose

Single authoritative probe that the Zonite backend is running **and** that the global
`/api` prefix, `ValidationPipe`, and Sikka success-response wrapper are all correctly
wired. Consumed by: local contributors (manual `curl`), `docker-compose` healthcheck,
and the Phase 0 CI smoke step (if/when added).

## Request

```
GET /api/health HTTP/1.1
Accept: application/json
```

- **Auth**: none. The endpoint is marked with Sikka's `@Public()` decorator so the
  global `JwtAuthGuard` (once installed in Phase 2) skips it automatically.
- **Query params**: none.
- **Headers**: none required.
- **Idempotent**: yes. Safe to call at any rate.

## Response — 200 OK

```json
{
  "code": 200,
  "success": true,
  "message": "Zonite backend is healthy",
  "data": {
    "status": "ok"
  },
  "timestamp": "2026-04-17T10:15:30.123Z"
}
```

### Field contract

| Field         | Type     | Constraint                          |
| ------------- | -------- | ----------------------------------- |
| `code`        | `number` | Always `200`                        |
| `success`     | `true`   | Literal `true`                      |
| `message`     | `string` | Non-empty; human-readable           |
| `data`        | `object` | Exactly `{ "status": "ok" }`        |
| `data.status` | `"ok"`   | Literal string `"ok"`               |
| `timestamp`   | `string` | ISO-8601 UTC, millisecond precision |

Envelope shape MUST match Sikka's `SuccessResponse<T>` byte-for-byte — no added
fields, no removed fields, no renamed fields.

## Response — error cases

This endpoint has no domain-level failure modes. The only non-200 responses are
framework-level: request routed outside `/api` (404), or backend process not up (no
response). Neither is the endpoint's responsibility to produce.

If, in later phases, a dependency (DB, Redis) is wired into the healthcheck, the
response will change to include `data.dependencies` and return a 503 when a
dependency is unreachable. **Phase 0 explicitly does not do this** — the endpoint
checks only that the backend process is alive.

## Implementation notes (non-normative)

- Controller: `HealthController` at `apps/backend/src/modules/health/controllers/`.
- Decorator: `@HealthCheckEndpoint()` bundles `@ApiOperation`, `@ApiResponse` for
  Scalar docs (per Sikka's "Endpoint Decorator Pattern").
- Service: `HealthService.getStatus()` returns `{ status: 'ok' as const }`; trivial
  but present so the controller→service separation is demonstrated for later modules
  to copy.
- Response construction: `return successResponse({ status: 'ok' }, 'Zonite backend is
healthy', HttpStatus.OK)` — imported from `apps/backend/src/common/utils/
response.handler.ts`.

## Scalar docs registration

The endpoint appears in the Scalar docs UI at `/api/docs` with:

- `tag`: `Health`
- `summary`: `Liveness check`
- `responses`: `200 SuccessResponseDto<HealthStatusDto>`

`HealthStatusDto` declares `@ApiProperty({ example: 'ok' }) status: 'ok'` — the first
use of the DTO + example pattern Sikka mandates.

## Traceability

- Spec FR-009a: "The backend MUST expose `GET /api/health`…" → this contract.
- Spec User Story 1 Independent Test → references the exact payload above.
- Clarification #3 (2026-04-17) → chose this endpoint + envelope.
- Constitution Principle II → envelope shape is non-negotiable.
