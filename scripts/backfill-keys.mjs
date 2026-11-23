#!/usr/bin/env node
// Give every account that is missing a license key one, and print the result.
//
//   node scripts/backfill-keys.mjs            assign missing keys
//   node scripts/backfill-keys.mjs --dry-run  report only, change nothing
//
// Accounts created before `licenseKey` existed only have a username, so the
// injected panel cannot find them by key. This walks the collection once and
// fills the gap. Keys are never overwritten -- an account that already has one
// is left alone.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

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

const dryRun = process.argv.slice(2).includes('--dry-run');

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

const KEY_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function generateLicenseKey() {
  return Array.from({ length: 4 }, () =>
    Array.from({ length: 4 }, () => KEY_ALPHABET[crypto.randomInt(0, KEY_ALPHABET.length)]).join('')
  ).join('-');
}

// --- run -------------------------------------------------------------------

await mongoose.connect(URI, { bufferCommands: false });

try {
  // A document can be missing the field entirely or hold an empty string; both
  // mean "no key" and both need one.
  const users = await User.find({
    $or: [{ licenseKey: { $exists: false } }, { licenseKey: null }, { licenseKey: '' }],
  }).sort({ username: 1 });

  if (users.length === 0) {
    console.log('every account already has a license key');
  } else {
    console.log(`${dryRun ? 'would assign' : 'assigning'} ${users.length} key(s)\n`);
    for (const user of users) {
      const key = generateLicenseKey();
      if (!dryRun) {
        user.licenseKey = key;
        await user.save();
      }
      console.log(`  ${user.username.padEnd(24)} ${dryRun ? '(dry run)' : key}`);
    }
  }

  if (!dryRun) {
    const total = await User.countDocuments({});
    const withKey = await User.countDocuments({
      licenseKey: { $exists: true, $nin: [null, ''] },
    });
    console.log(`\n${withKey}/${total} accounts now hold a key`);
  }
} catch (error) {
  if (error?.code === 11000) {
    console.error('a generated key collided with an existing one -- run it again');
  } else {
    console.error(error?.message || error);
  }
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
