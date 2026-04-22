export class HealthResponseDto {
  status!: "ok";
  uptime!: number;
  environment!: "development" | "production";
}

