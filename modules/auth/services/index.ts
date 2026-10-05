import "server-only";

import { getUserRepository } from "@/modules/auth/repositories";
import { AuthService } from "@/modules/auth/services/auth.service";

let authServiceInstance: AuthService | undefined;

export function getAuthService(): AuthService {
  authServiceInstance ??= new AuthService(getUserRepository());
  return authServiceInstance;
}
