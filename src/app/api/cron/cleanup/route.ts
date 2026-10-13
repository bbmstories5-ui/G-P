import { NextRequest, NextResponse } from 'next/server';
import { runDaily15DayExpirationScheduler } from '@/lib/cleanup-scheduler';

export const runtime = 'nodejs';

/**
 * GET & POST /api/cron/cleanup
 * Server-side daily scheduled cron task that checks all graphics.
 * If any graphic is >= 15 days old, it enters the Super Admin approval queue.
 * Never deletes graphics automatically without Super Admin approval.
 */
export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  try {
    // Optional security check: if CRON_SECRET is configured in environment
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      const apiKey = req.headers.get('x-api-key') || req.headers.get('x-cron-secret');
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      if (token !== cronSecret && apiKey !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
      }
    }

    const result = await runDaily15DayExpirationScheduler();
    return NextResponse.json({
      success: true,
      message: '15-Day Graphic Expiration Scheduler executed successfully',
      result,
    });
  } catch (error: any) {
    console.error('Error executing 15-day cleanup cron job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute cleanup scheduler' },
      { status: 500 }
    );
  }
}
