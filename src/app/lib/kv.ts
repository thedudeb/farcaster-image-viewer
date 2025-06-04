import { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: 'https://emerging-wolf-36464.upstash.io',
  token: 'AY5wAAIjcDE3Mjc4YzcwMmNiYjY0N2FhYTczYjBiNDZlZTBjZDM0OHAxMA',
});

// Test Redis connection
export async function testRedisConnection(): Promise<boolean> {
  try {
    await redis.ping();
    console.log("Redis connection successful");
    return true;
  } catch (error) {
    console.error("Redis connection failed:", error);
    return false;
  }
}

// User notification details
function getUserNotificationDetailsKey(fid: number): string {
  return `frames-v2-demo:user:${fid}`;
}

// User tracking
function getUserKey(fid: number): string {
  return `frames-v2-demo:user-info:${fid}`;
}

// Event logs
function getEventLogKey(): string {
  return `frames-v2-demo:events`;
}

// Users list
function getUsersListKey(): string {
  return `frames-v2-demo:users-list`;
}

export interface UserInfo {
  fid: number;
  username?: string;
  addedAt: string;
  lastActivity: string;
  hasNotifications: boolean;
  eventsCount: number;
}

export interface EventLog {
  id: string;
  fid: number;
  event: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export async function getUserNotificationDetails(
  fid: number
): Promise<FrameNotificationDetails | null> {
  return await redis.get<FrameNotificationDetails>(
    getUserNotificationDetailsKey(fid)
  );
}

export async function setUserNotificationDetails(
  fid: number,
  notificationDetails: FrameNotificationDetails
): Promise<void> {
  await redis.set(getUserNotificationDetailsKey(fid), notificationDetails);
  
  // Update user info
  await updateUserInfo(fid, { hasNotifications: true });
}

export async function deleteUserNotificationDetails(
  fid: number
): Promise<void> {
  await redis.del(getUserNotificationDetailsKey(fid));
  
  // Update user info
  await updateUserInfo(fid, { hasNotifications: false });
}

// User tracking functions
export async function addUser(fid: number, username?: string): Promise<void> {
  const now = new Date().toISOString();
  const userInfo: UserInfo = {
    fid,
    username,
    addedAt: now,
    lastActivity: now,
    hasNotifications: false,
    eventsCount: 0,
  };
  
  await redis.set(getUserKey(fid), userInfo);
  await redis.sadd(getUsersListKey(), fid);
}

export async function trackUserFromSDK(fid: number, username?: string): Promise<void> {
  const existing = await redis.get<UserInfo>(getUserKey(fid));
  if (!existing) {
    // New user from SDK
    await addUser(fid, username);
  } else if (username && !existing.username) {
    // Update existing user with username
    const updated = { 
      ...existing, 
      username,
      lastActivity: new Date().toISOString(),
    };
    await redis.set(getUserKey(fid), updated);
  } else {
    // Just update last activity
    const updated = { 
      ...existing, 
      lastActivity: new Date().toISOString(),
    };
    await redis.set(getUserKey(fid), updated);
  }
}

export async function updateUserInfo(fid: number, updates: Partial<UserInfo>): Promise<void> {
  const existing = await redis.get<UserInfo>(getUserKey(fid));
  if (existing) {
    const updated = { 
      ...existing, 
      ...updates, 
      lastActivity: new Date().toISOString(),
      eventsCount: (existing.eventsCount || 0) + 1
    };
    await redis.set(getUserKey(fid), updated);
  }
}

export async function removeUser(fid: number): Promise<void> {
  await redis.del(getUserKey(fid));
  await redis.srem(getUsersListKey(), fid);
}

// Event logging
export async function logEvent(fid: number, event: string, details?: Record<string, unknown>): Promise<void> {
  try {
    // Generate a simple UUID-like ID
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const eventLog: EventLog = {
      id,
      fid,
      event,
      timestamp: new Date().toISOString(),
      details,
    };
    
    await redis.lpush(getEventLogKey(), JSON.stringify(eventLog));
    // Keep only last 1000 events
    await redis.ltrim(getEventLogKey(), 0, 999);
  } catch (error) {
    console.error("Error logging event:", error);
    // Don't throw error - logging should not break the main flow
  }
}

// Admin analytics functions
export async function getAllUsers(): Promise<UserInfo[]> {
  try {
    const fids = await redis.smembers(getUsersListKey());
    if (!fids || fids.length === 0) {
      return [];
    }
    
    const users: UserInfo[] = [];
    
    for (const fid of fids) {
      const userInfo = await redis.get<UserInfo>(getUserKey(Number(fid)));
      if (userInfo) {
        users.push(userInfo);
      }
    }
    
    return users.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
}

export async function getRecentEvents(limit: number = 100): Promise<EventLog[]> {
  try {
    const events = await redis.lrange(getEventLogKey(), 0, limit - 1);
    if (!events || events.length === 0) {
      return [];
    }
    
    return events.map(event => {
      try {
        return JSON.parse(event as string);
      } catch (parseError) {
        console.error("Error parsing event:", parseError);
        return null;
      }
    }).filter(Boolean) as EventLog[];
  } catch (error) {
    console.error("Error getting recent events:", error);
    return [];
  }
}

export async function getAnalytics() {
  try {
    const users = await getAllUsers();
    
    const totalUsers = users.length;
    const usersWithNotifications = users.filter(u => u.hasNotifications).length;
    const recentUsers = users.filter(u => {
      const addedAt = new Date(u.addedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return addedAt > weekAgo;
    }).length;
    
    return {
      totalUsers,
      usersWithNotifications,
      recentUsers,
    };
  } catch (error) {
    console.error("Error getting analytics:", error);
    // Return default values in case of error
    return {
      totalUsers: 0,
      usersWithNotifications: 0,
      recentUsers: 0,
    };
  }
}

// Function to clear problematic event data
export async function clearEventData(): Promise<void> {
  try {
    await redis.del(getEventLogKey());
    console.log("Event data cleared successfully");
  } catch (error) {
    console.error("Error clearing event data:", error);
  }
} 