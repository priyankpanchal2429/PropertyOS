import { UserRepository } from '../repositories/userRepository.js';
import { RefreshTokenRepository } from '../repositories/refreshTokenRepository.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { ApiError } from '../utils/apiError.js';

const userRepository = new UserRepository();
const tokenRepository = new RefreshTokenRepository();

export class AuthService {
  async login(usernameOrEmail: string, password: string, ipAddress?: string, userAgent?: string) {
    const user = await userRepository.findByUsernameOrEmail(usernameOrEmail);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid username/email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid username/email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await tokenRepository.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refresh(token: string, ipAddress?: string, userAgent?: string) {
    try {
      const decoded = verifyRefreshToken(token);
      const storedToken = await tokenRepository.findByToken(token);

      if (!storedToken) {
        throw new ApiError(401, 'Refresh token not found');
      }

      // If token is revoked, it's a security breach (potential reuse). Revoke all user sessions.
      if (storedToken.isRevoked) {
        await tokenRepository.revokeAllUserTokens(storedToken.user.toString());
        throw new ApiError(401, 'Session revoked due to token reuse detection');
      }

      if (storedToken.expiresAt < new Date()) {
        throw new ApiError(401, 'Refresh token has expired');
      }

      // Populate user info
      const user = await userRepository.findById(storedToken.user.toString());
      if (!user || !user.isActive) {
        throw new ApiError(401, 'User account is inactive or not found');
      }

      // Generate new tokens (Rotation)
      const newAccessToken = generateAccessToken({
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = generateRefreshToken({ userId: user.id });

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create new token
      await tokenRepository.create({
        user: user._id,
        token: newRefreshToken,
        expiresAt,
        ipAddress,
        userAgent,
      });

      // Revoke old token, linking to the new one
      await tokenRepository.revoke(token, newRefreshToken);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async logout(token: string) {
    const storedToken = await tokenRepository.findByToken(token);
    if (storedToken) {
      await tokenRepository.revoke(token);
    }
  }
}
