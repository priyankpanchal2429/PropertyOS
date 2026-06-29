import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { AuthenticatedRequest } from '../types/index.js';
import { UserRepository } from '../repositories/userRepository.js';
import { ApiError } from '../utils/apiError.js';

const userRepository = new UserRepository();

const authService = new AuthService();

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true' || isProd,
    sameSite: (process.env.COOKIE_SAME_SITE || (isProd ? 'none' : 'lax')) as 'lax' | 'strict' | 'none',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth', // Scoped to auth endpoints to minimize exposure
  };
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { usernameOrEmail, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(usernameOrEmail, password, ipAddress, userAgent);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    res.status(200).json({
      status: 'success',
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) {
      return res.status(401).json({
        status: 'error',
        statusCode: 401,
        message: 'No refresh token provided',
      });
    }

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.refresh(token, ipAddress, userAgent);

    // Update refresh token cookie (rotation)
    res.cookie('refreshToken', result.refreshToken, getCookieOptions());

    res.status(200).json({
      status: 'success',
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    // Clear cookie on refresh failure
    res.clearCookie('refreshToken', { path: '/api/auth' });
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie('refreshToken', { path: '/api/auth' });
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      return next(new ApiError(401, 'Unauthorized: Access token is missing or invalid'));
    }
    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
