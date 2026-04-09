import { AuthUser } from './IAuthUser';

export interface AuthState {
  loggedIn: boolean;
  user: AuthUser | null;
}
