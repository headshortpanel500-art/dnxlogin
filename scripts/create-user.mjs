#!/usr/bin/env node
// Create or update a license account from the command line.
//
//   node scripts/create-user.mjs <username> <password> [days] [devices] [key]
//
// Examples:
//   node scripts/create-user.mjs adi hunter2 365
//   node scripts/create-user.mjs adi hunter2 30 2
//   node scripts/create-user.mjs adi hunter2 365 1 ABCD-EFGH-JKMN-PQRS
//
// `days` defaults to 30, `devices` to 1 (0 = unlimited), `key` is generated.
// If the username already exists the password, expiry, device limit and key are
// updated in place, so the same command doubles as "renew" and "reset password".

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// --- env -------------------------------------------------------------------
// Next reads .env.local; a bare node script does not. Load it by hand so this
// works without adding dotenv to the dependency tree.

function loadEnv() {
  const root = process.cwd();
  for (const name of ['.env.local', '.env']) {
    const file = path.join(root, name);
    if (!fs.existsSync(file)) continue;
    for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq < 0) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadEnv();

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}

// --- args ------------------------------------------------------------------

const [username, password, daysArg, devicesArg, keyArg] = process.argv.slice(2);

if (!username || !password) {
  console.error('usage: node scripts/create-user.mjs <username> <password> [days] [devices] [key]');
  process.exit(1);
}

const days = Number(daysArg ?? 30);
const devices = Number(devicesArg ?? 1);

if (!Number.isFinite(days) || days <= 0) {
  console.error(`days must be a positive number, got "${daysArg}"`);
  process.exit(1);
}
if (!Number.isFinite(devices) || devices < 0) {
  console.error(`devices must be 0 (unlimited) or a positive number, got "${devicesArg}"`);
  process.exit(1);
}

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateLicenseKey() {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => KEY_ALPHABET[crypto.randomInt(0, KEY_ALPHABET.length)]).join('')
  ).join('-');
}

const licenseKey = (keyArg && keyArg.trim()) || generateLicenseKey();

// The panel rejects anything that is not 19 characters before the request is
// even built, so catch a bad key here rather than at a customer's machine.
if (!/^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(licenseKey)) {
  console.error(`license key must look like XXXX-XXXX-XXXX-XXXX, got "${licenseKey}"`);
  process.exit(1);
}

// --- schema ----------------------------------------------------------------
// Declared here rather than imported from models/User.ts: that file is
// TypeScript and cannot be loaded by a plain node process.

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    licenseKey: { type: String, default: null, trim: true, index: { unique: true, sparse: true } },
    expiresAt: { type: Date, required: true },
    hwid: { type: String, default: null, index: true },
    hwidReset: { type: Boolean, default: false },
    lastLoginIP: { type: String, default: null },
    loginCount: { type: Number, default: 0 },
    deviceLimit: { type: Number, default: 0 },
    registeredHwids: { type: [String], default: [] },
    createdBy: { type: String, default: 'admin', index: true },
    createdByReseller: { type: String, default: null },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- run -------------------------------------------------------------------

const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + days);

await mongoose.connect(URI, { bufferCommands: false });

try {
  const hash = await bcrypt.hash(password, 10);

  const existing = await User.findOne({ username });

  if (existing) {
    existing.password = hash;
    existing.licenseKey = licenseKey;
    existing.expiresAt = expiresAt;
    existing.deviceLimit = devices;
    await existing.save();

    console.log(`updated ${username}`);
  } else {
    await User.create({
      username,
      password: hash,
      licenseKey,
      expiresAt,
      deviceLimit: devices,
      registeredHwids: [],
      createdBy: 'admin',
    });

    console.log(`created ${username}`);
  }

  console.log(`  key       ${licenseKey}`);
  console.log(`  expires   ${expiresAt.toISOString().slice(0, 10)} (${days} days)`);
  console.log(`  devices   ${devices === 0 ? 'unlimited' : devices}`);
} catch (error) {
  if (error?.code === 11000) {
    console.error('that license key is already attached to another account -- pass a different one');
  } else {
    console.error(error?.message || error);
  }
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
