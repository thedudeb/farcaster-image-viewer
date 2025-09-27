import { NextRequest } from "next/server";
import { z } from "zod";
import { getAnalytics, getAllUsers, testRedisConnection, clearEventData } from "../../lib/kv";
import { sendFrameNotification } from "../../lib/notifs";

const bulkNotificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
  targetUsers: z.enum(["all", "notifications_enabled"]).default("notifications_enabled"),
});

// GET /api/admin - Get analytics data
export async function GET() {
  try {
    console.log("Admin API: Starting to fetch users...");
    const users = await getAllUsers();
    console.log("Admin API: Users fetched successfully, count:", users.length);
    
    // Get basic analytics without heavy operations
    const analytics = {
      totalUsers: users.length,
      usersWithNotifications: users.filter(user => user.hasNotifications).length,
      totalEvents: 0, // Simplified for performance
    };
    
    return Response.json({
      success: true,
      data: {
        analytics,
        users,
      },
    });
  } catch (error) {
    console.error("Admin API error details:", error);
    return Response.json(
      { success: false, error: "Failed to fetch admin data", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin - Send bulk notifications
export async function POST(request: NextRequest) {
  try {
    const requestJson = await request.json();
    const requestBody = bulkNotificationSchema.safeParse(requestJson);

    if (requestBody.success === false) {
      return Response.json(
        { success: false, errors: requestBody.error.errors },
        { status: 400 }
      );
    }

    const { title, body, targetUsers } = requestBody.data;
    const users = await getAllUsers();
    
    // Filter users based on target
    const filteredUsers = targetUsers === "all" 
      ? users 
      : users.filter(user => user.hasNotifications);

    const results = {
      sent: 0,
      failed: 0,
      noToken: 0,
      rateLimited: 0,
    };

    // Send notifications to all filtered users
    for (const user of filteredUsers) {
      const result = await sendFrameNotification({
        fid: user.fid,
        title,
        body,
      });

      switch (result.state) {
        case "success":
          results.sent++;
          break;
        case "error":
          results.failed++;
          break;
        case "no_token":
          results.noToken++;
          break;
        case "rate_limit":
          results.rateLimited++;
          break;
      }
    }

    return Response.json({
      success: true,
      data: {
        targetedUsers: filteredUsers.length,
        results,
      },
    });
  } catch (error) {
    console.error("Bulk notification error:", error);
    return Response.json(
      { success: false, error: "Failed to send bulk notifications" },
      { status: 500 }
    );
  }
} 