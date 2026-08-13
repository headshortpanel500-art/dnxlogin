// models/user.ts
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
    deviceLimit: {
      type: Number,
      default: 0,
    },
    registeredHwids: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      default: 'admin',
      index: true,
    },
    createdByReseller: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

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
  },
  {
    timestamps: true,
  }
);

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

// ============ GridFS মেটাডেটা Schema ============
const FileMetadataSchema = new Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    fileId: {
      type: String,
      required: true,
      unique: true,
    },
    uploadedBy: {
      type: String,
      default: 'admin',
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);
// =================================================

export const User = models.User || model('User', UserSchema);
export const Reseller = models.Reseller || model('Reseller', ResellerSchema);
export const Settings = models.Settings || model('Settings', SettingsSchema);
export const FileMetadata = models.FileMetadata || model('FileMetadata', FileMetadataSchema);

export default User;