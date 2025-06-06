import { useEffect, useState } from 'react';
import * as frame from '@farcaster/frame-sdk';

interface NotificationProps {
  message: string;
  duration?: number;
  onClose?: () => void;
}

export default function Notification({ message, duration = 3000, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
      {message}
    </div>
  );
}

export async function showNotification(message: string, duration?: number) {
  try {
    const context = await frame.sdk.context;
    if (context?.client?.notificationDetails) {
      // If we're in a Farcaster frame, use the native notification system
      await frame.sdk.actions.showNotification({
        message,
        duration: duration || 3000
      });
    } else {
      // If we're not in a frame, create a custom event to show our notification component
      const event = new CustomEvent('showNotification', {
        detail: { message, duration }
      });
      window.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error showing notification:', error);
  }
} 