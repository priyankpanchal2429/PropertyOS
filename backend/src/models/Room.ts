import { Schema, model, Document } from 'mongoose';

export interface IRoom extends Document {
  number: string;
  type: '1 Queen Bed' | '1 King Bed' | '1 King ADA' | '2 Queen Beds';
  status: 'Vacant' | 'Dirty / Checkout' | 'Overstay';
  currentGuestName?: string;
  assignedHousekeeper?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>(
  {
    number: { type: String, required: true, unique: true, index: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ['1 Queen Bed', '1 King Bed', '1 King ADA', '2 Queen Beds'],
    },
    status: {
      type: String,
      required: true,
      enum: ['Vacant', 'Dirty / Checkout', 'Overstay'],
      default: 'Vacant',
    },
    currentGuestName: { type: String },
    assignedHousekeeper: { type: String },
  },
  {
    timestamps: true,
  }
);

export const Room = model<IRoom>('Room', RoomSchema);
