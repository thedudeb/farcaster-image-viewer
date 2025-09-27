import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEpochNotification } from '../../../lib/farcaster-notifications';

const epochNotificationSchema = z.object({
  epochId: z.number().min(1),
  artistName: z.string().min(1),
  artistFid: z.number().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    const requestBody = epochNotificationSchema.safeParse(requestJson);

    if (requestBody.success === false) {
      return NextResponse.json(
        { success: false, errors: requestBody.error.errors },
        { status: 400 }
      );
    }

    const { epochId, artistName, artistFid } = requestBody.data;

    const result = await sendEpochNotification(epochId, artistName, artistFid);

    return NextResponse.json({
      success: result.success,
      data: {
        epochId,
        artistName,
        artistFid,
        results: result.results,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Epoch notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send epoch notification' },
      { status: 500 }
    );
  }
}
