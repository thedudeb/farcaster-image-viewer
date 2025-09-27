import { sendFrameNotification } from './notifs';
import { getAllUsers, getUserNotificationDetails } from './kv';

/**
 * Enhanced Farcaster Mini App Notification Service
 * Based on Farcaster Mini App SDK documentation from miniapps.farcaster.xyz
 */
export class FarcasterNotificationService {
  private static instance: FarcasterNotificationService;

  public static getInstance(): FarcasterNotificationService {
    if (!FarcasterNotificationService.instance) {
      FarcasterNotificationService.instance = new FarcasterNotificationService();
    }
    return FarcasterNotificationService.instance;
  }

  /**
   * Send notification to a specific user by FID
   */
  async sendToUser(fid: number, title: string, body: string): Promise<{
    success: boolean;
    result: 'sent' | 'failed' | 'no_token' | 'rate_limited';
    error?: string;
  }> {
    try {
      const result = await sendFrameNotification({ fid, title, body });
      
      switch (result.state) {
        case 'success':
          return { success: true, result: 'sent' };
        case 'no_token':
          return { success: false, result: 'no_token', error: 'User has not enabled notifications' };
        case 'rate_limit':
          return { success: false, result: 'rate_limited', error: 'Rate limited' };
        case 'error':
          return { success: false, result: 'failed', error: String(result.error) };
        default:
          return { success: false, result: 'failed', error: 'Unknown error' };
      }
    } catch (error) {
      return { success: false, result: 'failed', error: String(error) };
    }
  }

  /**
   * Send notification to all users who have enabled notifications
   */
  async sendToAllUsers(title: string, body: string): Promise<{
    success: boolean;
    results: {
      sent: number;
      failed: number;
      noToken: number;
      rateLimited: number;
    };
    errors: string[];
  }> {
    try {
      const users = await getAllUsers();
      const usersWithNotifications = users.filter(user => user.hasNotifications);
      
      const results = {
        sent: 0,
        failed: 0,
        noToken: 0,
        rateLimited: 0,
      };
      const errors: string[] = [];

      for (const user of usersWithNotifications) {
        const result = await this.sendToUser(user.fid, title, body);
        
        switch (result.result) {
          case 'sent':
            results.sent++;
            break;
          case 'failed':
            results.failed++;
            if (result.error) errors.push(`FID ${user.fid}: ${result.error}`);
            break;
          case 'no_token':
            results.noToken++;
            break;
          case 'rate_limited':
            results.rateLimited++;
            break;
        }
      }

      return {
        success: results.sent > 0,
        results,
        errors,
      };
    } catch (error) {
      return {
        success: false,
        results: { sent: 0, failed: 0, noToken: 0, rateLimited: 0 },
        errors: [String(error)],
      };
    }
  }

  /**
   * Send notification to users following a specific FID
   */
  async sendToFollowers(followingFid: number, title: string, body: string): Promise<{
    success: boolean;
    results: {
      sent: number;
      failed: number;
      noToken: number;
      rateLimited: number;
    };
    errors: string[];
  }> {
    // Note: This would require additional API calls to get followers
    // For now, we'll send to all users with notifications enabled
    // In a full implementation, you'd query the Farcaster API for followers
    console.log(`Sending to followers of FID ${followingFid} (currently sending to all users)`);
    return this.sendToAllUsers(title, body);
  }

  /**
   * Send epoch release notification
   */
  async sendEpochReleaseNotification(epochId: number, artistName: string, artistFid: number): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const title = `🎨 New Epoch Available!`;
    const body = `Epoch ${epochId} by ${artistName} is now live. Tap to explore their amazing work!`;
    
    return this.sendToAllUsers(title, body);
  }

  /**
   * Send artist announcement notification
   */
  async sendArtistAnnouncement(artistName: string, message: string): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const title = `👤 ${artistName} Update`;
    const body = message;
    
    return this.sendToAllUsers(title, body);
  }

  /**
   * Send app update notification
   */
  async sendAppUpdateNotification(feature: string, description: string): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const title = `✨ New Feature: ${feature}`;
    const body = description;
    
    return this.sendToAllUsers(title, body);
  }

  /**
   * Send special event notification
   */
  async sendEventNotification(eventName: string, description: string): Promise<{
    success: boolean;
    results: any;
    errors: string[];
  }> {
    const title = `🎉 ${eventName}`;
    const body = description;
    
    return this.sendToAllUsers(title, body);
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    totalUsers: number;
    usersWithNotifications: number;
    notificationRate: number;
  }> {
    try {
      const users = await getAllUsers();
      const usersWithNotifications = users.filter(user => user.hasNotifications);
      
      return {
        totalUsers: users.length,
        usersWithNotifications: usersWithNotifications.length,
        notificationRate: users.length > 0 ? (usersWithNotifications.length / users.length) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalUsers: 0,
        usersWithNotifications: 0,
        notificationRate: 0,
      };
    }
  }

  /**
   * Check if a user has notifications enabled
   */
  async hasNotificationsEnabled(fid: number): Promise<boolean> {
    try {
      const notificationDetails = await getUserNotificationDetails(fid);
      return !!notificationDetails;
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }
}

// Export singleton instance
export const farcasterNotifications = FarcasterNotificationService.getInstance();

// Export convenience functions
export const sendEpochNotification = (epochId: number, artistName: string, artistFid: number) =>
  farcasterNotifications.sendEpochReleaseNotification(epochId, artistName, artistFid);

export const sendArtistNotification = (artistName: string, message: string) =>
  farcasterNotifications.sendArtistAnnouncement(artistName, message);

export const sendAppUpdateNotification = (feature: string, description: string) =>
  farcasterNotifications.sendAppUpdateNotification(feature, description);

export const sendEventNotification = (eventName: string, description: string) =>
  farcasterNotifications.sendEventNotification(eventName, description);

export const sendToAllUsers = (title: string, body: string) =>
  farcasterNotifications.sendToAllUsers(title, body);

export const sendToUser = (fid: number, title: string, body: string) =>
  farcasterNotifications.sendToUser(fid, title, body);
