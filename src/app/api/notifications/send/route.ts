import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { FarcasterNotificationService } from '../../../lib/farcaster-notifications';

const sendNotificationSchema = z.object({
  type: z.enum(['epoch', 'artist', 'app_update', 'event', 'custom']),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  target: z.enum(['all', 'followers']).default('all'),
  targetFid: z.number().optional(), // For followers target
  // Type-specific data
  epochId: z.number().optional(),
  artistName: z.string().optional(),
  artistFid: z.number().optional(),
  feature: z.string().optional(),
  eventName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    const requestBody = sendNotificationSchema.safeParse(requestJson);

    if (requestBody.success === false) {
      return NextResponse.json(
        { success: false, errors: requestBody.error.errors },
        { status: 400 }
      );
    }

    const { type, title, body, target, targetFid, epochId, artistName, artistFid, feature, eventName } = requestBody.data;

    const notificationService = FarcasterNotificationService.getInstance();
    let result;

    switch (type) {
      case 'epoch':
        if (!epochId || !artistName || !artistFid) {
          return NextResponse.json(
            { success: false, error: 'Epoch notifications require epochId, artistName, and artistFid' },
            { status: 400 }
          );
        }
        result = await notificationService.sendEpochReleaseNotification(epochId, artistName, artistFid);
        break;

      case 'artist':
        if (!artistName) {
          return NextResponse.json(
            { success: false, error: 'Artist notifications require artistName' },
            { status: 400 }
          );
        }
        result = await notificationService.sendArtistAnnouncement(artistName, body);
        break;

      case 'app_update':
        if (!feature) {
          return NextResponse.json(
            { success: false, error: 'App update notifications require feature' },
            { status: 400 }
          );
        }
        result = await notificationService.sendAppUpdateNotification(feature, body);
        break;

      case 'event':
        if (!eventName) {
          return NextResponse.json(
            { success: false, error: 'Event notifications require eventName' },
            { status: 400 }
          );
        }
        result = await notificationService.sendEventNotification(eventName, body);
        break;

      case 'custom':
        if (target === 'followers' && targetFid) {
          result = await notificationService.sendToFollowers(targetFid, title, body);
        } else {
          result = await notificationService.sendToAllUsers(title, body);
        }
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: result.success,
      data: {
        type,
        results: result.results,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// GET endpoint to get notification statistics
export async function GET() {
  try {
    const notificationService = FarcasterNotificationService.getInstance();
    const stats = await notificationService.getNotificationStats();
    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get notification statistics' },
      { status: 500 }
    );
  }
}
