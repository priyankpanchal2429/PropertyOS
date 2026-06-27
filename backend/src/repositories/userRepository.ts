import { User, IUser } from '../models/User.js';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id).exec();
  }

  async findByUsername(username: string): Promise<IUser | null> {
    return User.findOne({ username: username.toLowerCase() }).exec();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsernameOrEmail(identifier: string): Promise<IUser | null> {
    const cleanId = identifier.toLowerCase().trim();
    return User.findOne({
      $or: [{ username: cleanId }, { email: cleanId }],
    }).exec();
  }

  async create(user: Partial<IUser>): Promise<IUser> {
    return User.create(user);
  }
}
