import { AuthenticatedRequestUser } from '../shared/academic';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

export {};
