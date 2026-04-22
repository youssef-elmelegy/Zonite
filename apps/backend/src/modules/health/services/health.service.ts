import { Injectable } from "@nestjs/common";
import { env } from "@/env";

@Injectable()
export class HealthService {
  getStatus(): { status: "ok"; uptime: number; environment: "development" | "production" } {
    return {
      status: "ok",
      uptime: process.uptime(),
      environment: (env.NODE_ENV === "production" ? "production" : "development") as
        | "development"
        | "production",
    };
  }
}

