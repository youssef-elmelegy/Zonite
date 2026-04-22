import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "@/common/decorators";
import { successResponse } from "@/utils";
import { HealthService } from "../services/health.service";
import { HealthCheckEndpoint } from "../decorators/health-check-endpoint.decorator";
import type { SuccessResponse } from "@/types";

interface HealthCheckResult {
  status: "ok";
  uptime: number;
  environment: "development" | "production";
}

@Controller("health")
@ApiTags("health")
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  @HealthCheckEndpoint()
  getHealth(): SuccessResponse<HealthCheckResult> {
    const result = this.healthService.getStatus();
    return successResponse(result, "Health OK", 200);
  }
}

