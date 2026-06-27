import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Manager' | 'Staff' | 'FrontDesk' | 'Accountant' | 'HR' | 'Maintenance';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['Admin', 'Manager', 'Staff', 'FrontDesk', 'Accountant', 'HR', 'Maintenance'],
      default: 'Staff',
    },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Compare candidate password with stored hash
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', UserSchema);
