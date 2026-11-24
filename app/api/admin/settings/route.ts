import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User, { Settings } from '@/models/User';
import { requireAdmin, unauthorized } from '@/lib/auth';
import { errMsg } from '@/lib/errors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SETTING_KEYS = new Set([
  'serverStatus',
  'maintenanceMessage',
  'requiredVersion',
  'updateDownloadUrl',
  'resellerMaxDeviceLimit',
  'allowResellerUnlimited',
  'hwidLockStrictness',
  'webhookUrl',
  'webhookAlerts',
]);

// GET all admin settings + system stats
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    const startTime = Date.now();
    await dbConnect();
    const pingMs = Date.now() - startTime;

    const allDocs = await Settings.find({
      key: { $in: Array.from(ALLOWED_SETTING_KEYS) },
    }).lean();

    const settingsMap: Record<string, unknown> = {};
    for (const doc of allDocs) {
      settingsMap[doc.key] = doc.value;
    }

    const [expiredCount, totalDevicesResult] = await Promise.all([
      User.countDocuments({ expiresAt: { $lt: new Date() } }),
      User.aggregate([
        {
          $project: {
            deviceCount: {
              $cond: {
                if: { $isArray: '$registeredDevices' },
                then: { $size: '$registeredDevices' },
                else: { $cond: [{ $ifNull: ['$hwid', false] }, 1, 0] },
              },
            },
          },
        },
        { $group: { _id: null, total: { $sum: '$deviceCount' } } },
      ]),
    ]);

    const totalBoundDevices = totalDevicesResult[0]?.total || 0;

    return NextResponse.json({
      success: true,
      settings: {
        serverStatus: (settingsMap.serverStatus as string) || 'online',
        maintenanceMessage:
          (settingsMap.maintenanceMessage as string) ||
          'Server undergoing scheduled maintenance. Please check back shortly.',
        requiredVersion: (settingsMap.requiredVersion as string) || '1.0.0',
        updateDownloadUrl: (settingsMap.updateDownloadUrl as string) || '',
        resellerMaxDeviceLimit:
          typeof settingsMap.resellerMaxDeviceLimit === 'number'
            ? settingsMap.resellerMaxDeviceLimit
            : 100,
        allowResellerUnlimited:
          typeof settingsMap.allowResellerUnlimited === 'boolean'
            ? settingsMap.allowResellerUnlimited
            : true,
        hwidLockStrictness:
          (settingsMap.hwidLockStrictness as string) || 'strict',
        webhookUrl: (settingsMap.webhookUrl as string) || '',
        webhookAlerts: settingsMap.webhookAlerts || {
          onLogin: true,
          onKeyCreated: true,
          onHwidReset: true,
        },
      },
      diagnostics: {
        pingMs,
        expiredCount,
        totalBoundDevices,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to fetch settings') },
      { status: 500 }
    );
  }
}

// POST update settings or run maintenance actions
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await dbConnect();
    const body = await req.json();

    // Check if this is a maintenance action
    if (body.action) {
      if (body.action === 'pruneExpired') {
        const result = await User.deleteMany({ expiresAt: { $lt: new Date() } });
        return NextResponse.json({
          success: true,
          message: `Pruned ${result.deletedCount || 0} expired licenses.`,
          deletedCount: result.deletedCount || 0,
        });
      }

      if (body.action === 'resetAllHwids') {
        const result = await User.updateMany(
          {},
          { $set: { hwid: null, registeredDevices: [] } }
        );
        return NextResponse.json({
          success: true,
          message: `Cleared device bindings on ${result.modifiedCount || 0} licenses.`,
          modifiedCount: result.modifiedCount || 0,
        });
      }

      return NextResponse.json(
        { success: false, error: `Unknown action: ${body.action}` },
        { status: 400 }
      );
    }

    const { key, value } = body;

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Key is required' },
        { status: 400 }
      );
    }

    if (!ALLOWED_SETTING_KEYS.has(key)) {
      return NextResponse.json(
        { success: false, error: `Unknown setting: ${key}` },
        { status: 400 }
      );
    }

    if (key === 'serverStatus' && value !== 'online' && value !== 'offline') {
      return NextResponse.json(
        { success: false, error: "serverStatus must be 'online' or 'offline'" },
        { status: 400 }
      );
    }

    const setting = await Settings.findOneAndUpdate(
      { key },
      { key, value },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      data: setting,
      message: 'Setting updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: errMsg(error, 'Failed to update settings') },
      { status: 500 }
    );
  }
}
