import { useEffect, useState } from 'react';

interface NotificationProps {
  message: string;
  duration?: number;
  type?: string;
  artistProfile?: string;
  onClose?: () => void;
}

export default function Notification({ message, duration = 6000, type, artistProfile, onClose }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Special styling for Epoch 5 notice
  if (type === 'epoch5-notice') {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-4 rounded-lg shadow-lg transition-opacity duration-300 max-w-md text-center">
        <div className="mb-3">
          <p className="text-sm opacity-90">{message}</p>
        </div>
        {artistProfile && (
          <button
            onClick={async () => {
              try {
                console.log('Profile button clicked, artistProfile:', artistProfile);
                
                // Import the frame SDK
                const frame = await import('@farcaster/frame-sdk');
                console.log('Frame SDK loaded:', frame);
                
                // Try to open URL in main client (frame stays open)
                if (frame.sdk && frame.sdk.actions) {
                  console.log('Frame SDK actions available:', frame.sdk.actions);
                  
                  // Extract username from URL
                  const username = artistProfile.split('/').pop();
                  console.log('Extracted username:', username);
                  
                  try {
                    // Try viewProfile method first (if available)
                    if (frame.sdk.actions.viewProfile) {
                      console.log('Attempting to use viewProfile...');
                      await frame.sdk.actions.viewProfile(username);
                      console.log('Successfully opened with viewProfile');
                    } else {
                      throw new Error('viewProfile not available');
                    }
                  } catch (err) {
                    console.log('viewProfile failed, trying farcaster:// URL:', err);
                    try {
                      // Try farcaster:// URL format
                      const mainClientUrl = artistProfile.replace('https://warpcast.com', 'farcaster://');
                      console.log('Trying mainClientUrl:', mainClientUrl);
                      await frame.sdk.actions.openUrl(mainClientUrl);
                      console.log('Successfully opened mainClientUrl');
                    } catch (err2) {
                      console.log('mainClientUrl failed, trying target client:', err2);
                      try {
                        // Try with target parameter
                        await (frame.sdk.actions as { openUrl: (url: string, options?: { target?: string }) => Promise<void> }).openUrl(artistProfile, { target: 'client' });
                        console.log('Successfully opened with target client');
                      } catch (err3) {
                        console.log('target client failed, trying regular openUrl:', err3);
                        // Fallback to regular openUrl
                        await frame.sdk.actions.openUrl(artistProfile);
                        console.log('Successfully opened with regular openUrl');
                      }
                    }
                  }
                } else {
                  console.log('Frame SDK not available, falling back to window.open');
                  // Fallback to opening in new tab
                  window.open(artistProfile, '_blank');
                }
              } catch (err) {
                console.error('Error opening profile:', err);
                // Fallback to opening in new tab
                window.open(artistProfile, '_blank');
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            View Artist Profile
          </button>
        )}
      </div>
    );
  }

  // Default notification styling
  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg transition-opacity duration-300">
      {message}
    </div>
  );
} 