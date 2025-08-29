import {
  ParseWebhookEvent,
  parseWebhookEvent,
  verifyAppKeyWithNeynar,
} from "@farcaster/frame-node";
import { NextRequest } from "next/server";
import {
  deleteUserNotificationDetails,
  setUserNotificationDetails,
  addUser,
  removeUser,
  logEvent,
} from "../../lib/kv";
import { sendFrameNotification } from "../../lib/notifs";

export async function POST(request: NextRequest) {
  const requestJson = await request.json();

  let data;
  try {
    data = await parseWebhookEvent(requestJson, verifyAppKeyWithNeynar);
  } catch (e: unknown) {
    const error = e as ParseWebhookEvent.ErrorType;

    switch (error.name) {
      case "VerifyJsonFarcasterSignature.InvalidDataError":
      case "VerifyJsonFarcasterSignature.InvalidEventDataError":
        // The request data is invalid
        return Response.json(
          { success: false, error: error.message || 'Invalid data error' },
          { status: 400 }
        );
      case "VerifyJsonFarcasterSignature.InvalidAppKeyError":
        // The app key is invalid
        return Response.json(
          { success: false, error: error.message || 'Invalid app key error' },
          { status: 401 }
        );
      case "VerifyJsonFarcasterSignature.VerifyAppKeyError":
        // Internal error verifying the app key (caller may want to try again)
        return Response.json(
          { success: false, error: error.message || 'Verify app key error' },
          { status: 500 }
        );
    }
  }

  const fid = data.fid;
  const event = data.event;

  // Log all events
  await logEvent(fid, event.event, event);

  switch (event.event) {
    case "frame_added":
      // Add user to our tracking system (webhook doesn't have username)
      await addUser(fid);
      
      if (event.notificationDetails) {
        await setUserNotificationDetails(fid, event.notificationDetails);
        await sendFrameNotification({
          fid,
          title: "Welcome to 0ffline Viewer!",
          body: "Mini app added to client. You can now receive notifications.",
        });
      } else {
        await deleteUserNotificationDetails(fid);
      }

      break;
    case "frame_removed":
      await deleteUserNotificationDetails(fid);
      await removeUser(fid);

      break;
    case "notifications_enabled":
      await setUserNotificationDetails(fid, event.notificationDetails);
      await sendFrameNotification({
        fid,
        title: "Ding ding ding",
        body: "Notifications are now enabled! Stay tuned for updates.",
      });

      break;
    case "notifications_disabled":
      await deleteUserNotificationDetails(fid);

      break;
  }

  return Response.json({ success: true });
} 