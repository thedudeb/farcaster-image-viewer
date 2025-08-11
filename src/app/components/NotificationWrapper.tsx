'use client';

import { useEffect, useState } from 'react';
import { FrameInit } from './FrameInit';
import Notification from './Notification';

export default function NotificationWrapper() {
  const [notification, setNotification] = useState<{ 
    message: string; 
    duration?: number; 
    type?: string;
    artistProfile?: string;
  } | null>(null);

  useEffect(() => {
    const handleNotification = (event: CustomEvent<{ 
      message: string; 
      duration?: number; 
      type?: string;
      artistProfile?: string;
    }>) => {
      setNotification(event.detail);
    };

    window.addEventListener('showNotification', handleNotification as EventListener);
    return () => window.removeEventListener('showNotification', handleNotification as EventListener);
  }, []);

  return (
    <>
      <FrameInit />
      {notification && (
        <Notification
          message={notification.message}
          duration={notification.duration}
          type={notification.type}
          artistProfile={notification.artistProfile}
          onClose={() => setNotification(null)}
        />
      )}
    </>
  );
} 