import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
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
    expiresAt: {
      type: Date,
      required: true,
    },
    hwid: {
      type: String,
      default: null, // blank থাকবে প্রথমে
      index: true, // দ্রুত সার্চের জন্য
    },
    hwidReset: {
      type: Boolean,
      default: false, // HWID রিসেট রিকুয়েস্ট
    },
    lastLoginIP: {
      type: String,
      default: null,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model('User', UserSchema);

export default User;