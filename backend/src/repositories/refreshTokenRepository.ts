import { RefreshToken, IRefreshToken } from '../models/RefreshToken.js';

export class RefreshTokenRepository {
  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token }).populate('user').exec();
  }

  async create(tokenData: Partial<IRefreshToken>): Promise<IRefreshToken> {
    return RefreshToken.create(tokenData);
  }

  async revoke(token: string, replacedByToken?: string): Promise<void> {
    await RefreshToken.updateOne(
      { token },
      { $set: { isRevoked: true, replacedByToken } }
    ).exec();
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await RefreshToken.updateMany(
      { user: userId, isRevoked: false },
      { $set: { isRevoked: true } }
    ).exec();
  }
}
