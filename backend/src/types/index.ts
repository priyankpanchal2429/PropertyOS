import { Request } from 'express';
import { AccessTokenPayload } from '../utils/jwt.js';

export interface AuthenticatedRequest extends Request {
  user?: AccessTokenPayload;
}
