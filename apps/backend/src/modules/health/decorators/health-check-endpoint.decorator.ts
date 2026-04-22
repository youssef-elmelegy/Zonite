import { applyDecorators, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";

/**
 * Bundle of metadata for GET /api/health.
 * Documents the real envelope response shape with Swagger.
 */
export function HealthCheckEndpoint() {
  return applyDecorators(
    HttpCode(HttpStatus.OK),
    ApiOkResponse({
      description: "Health check successful",
      schema: {
        type: "object",
        properties: {
          code: { type: "number", example: 200 },
          success: { type: "boolean", example: true },
          message: { type: "string", example: "Health OK" },
          data: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
              uptime: { type: "number", example: 123.456 },
              environment: { type: "string", enum: ["development", "production"], example: "development" },
            },
          },
          timestamp: { type: "string", example: "2026-04-22T12:00:00.000Z" },
        },
      },
    }),
  );
}

