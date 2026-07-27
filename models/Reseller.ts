// models/Reseller.ts
import mongoose, { Schema, model, models } from 'mongoose';

const ResellerSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    level: {
      type: Number,
      default: 1,
    },
    maxUsers: {
      type: Number,
      default: 0, // 0 = unlimited
    },
    totalUsersCreated: {
      type: Number,
      default: 0,
    },
    activeUsersCount: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Reseller = models.Reseller || model('Reseller', ResellerSchema);
export default Reseller;