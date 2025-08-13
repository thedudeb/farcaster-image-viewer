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
                
                if (frame.sdk && frame.sdk.actions) {
                  console.log('Frame SDK actions available:', Object.keys(frame.sdk.actions));
                  
                  // Use openUrl with farcaster:// scheme to open in main client
                  const mainClientUrl = artistProfile.replace('https://warpcast.com', 'farcaster://');
                  console.log('Trying farcaster:// URL:', mainClientUrl);
                  
                  await frame.sdk.actions.openUrl({ url: mainClientUrl });
                  console.log('Successfully opened with openUrl');
                  
                } else {
                  console.log('Frame SDK not available, falling back to window.open');
                  window.open(artistProfile, '_blank');
                }
              } catch (err) {
                console.error('Error in profile button:', err);
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