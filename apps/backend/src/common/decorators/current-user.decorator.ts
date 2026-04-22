import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { CurrentUser } from "@zonite/shared";

export const CurrentUserDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// Alias for convenience
export const CurrentUser = CurrentUserDecorator;
