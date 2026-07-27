// models/Session.ts
import mongoose, { Schema, model, models } from 'mongoose';

const SessionSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      enum: ['admin', 'reseller'],
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Session = models.Session || model('Session', SessionSchema);
export default Session;