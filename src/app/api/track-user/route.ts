import { NextRequest } from "next/server";
import { z } from "zod";
import { trackUserFromSDK } from "../../lib/kv";

const notificationDetailsSchema = z.object({
  url: z.string(),
  token: z.string(),
}).optional();

const trackUserSchema = z.object({
  fid: z.number(),
  username: z.string().optional(),
  notificationDetails: notificationDetailsSchema,
  added: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    const requestBody = trackUserSchema.safeParse(requestJson);

    if (requestBody.success === false) {
      return Response.json(
        { success: false, errors: requestBody.error.errors },
        { status: 400 }
      );
    }

    const { fid, username, notificationDetails, added } = requestBody.data;
    
    await trackUserFromSDK(fid, username, notificationDetails, added);
    
    return Response.json({ success: true });
  } catch (error) {
    console.error("Track user error:", error);
    return Response.json(
      { success: false, error: "Failed to track user" },
      { status: 500 }
    );
  }
} 