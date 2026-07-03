import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Extrage utilizatorul autentificat (setat de strategiile Passport).
 * `@CurrentUser()` -> tot obiectul, `@CurrentUser('id')` -> un singur câmp.
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
