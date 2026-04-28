import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { CurrentUser as CurrentUserType } from '@zonite/shared';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): CurrentUserType | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (data && user) {
      return user[data];
    }
    return user;
  },
);
