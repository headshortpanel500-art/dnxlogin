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
      default: null,
      index: true,
    },
    hwidReset: {
      type: Boolean,
      default: false,
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

// Settings Schema for Version Control
const SettingsSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const User = models.User || model('User', UserSchema);
export const Settings = models.Settings || model('Settings', SettingsSchema);

export default User;