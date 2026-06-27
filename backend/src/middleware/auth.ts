import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Unauthorized: Access token is missing or invalid'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new ApiError(401, 'Unauthorized: Token is malformed'));
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    let msg = 'Unauthorized: Invalid token';
    if (error.name === 'TokenExpiredError') {
      msg = 'Unauthorized: Access token has expired';
    }
    return next(new ApiError(401, msg));
  }
};
