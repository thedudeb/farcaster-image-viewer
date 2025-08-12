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
            onClick={() => {
              try {
                console.log('Profile button clicked, artistProfile:', artistProfile);
                
                // Check if we're in a Farcaster frame environment
                if (typeof window !== 'undefined' && 
                    'sdk' in window && 
                    typeof (window as { sdk?: { actions?: { close?: () => void, openUrl?: (url: string) => void } } }).sdk?.actions?.close === 'function') {
                  
                  console.log('Frame SDK available, minimizing frame first...');
                  
                  // First, minimize/close the frame
                  (window as { sdk: { actions: { close: () => void } } }).sdk.actions.close();
                  
                  // Then open the profile URL in the main client after a short delay
                  setTimeout(() => {
                    console.log('Opening profile in main client after minimize');
                    try {
                      // Try farcaster:// URL format to force main client
                      const mainClientUrl = artistProfile.replace('https://warpcast.com', 'farcaster://');
                      console.log('Trying mainClientUrl:', mainClientUrl);
                      
                      // Use window.open as fallback since frame is now closed
                      window.open(mainClientUrl, '_blank');
                      console.log('Successfully opened mainClientUrl');
                    } catch (err) {
                      console.error('Error opening profile after minimize:', err);
                      window.open(artistProfile, '_blank');
                    }
                  }, 100); // 100ms delay to ensure frame closes first
                  
                } else {
                  console.log('Frame SDK not available, falling back to window.open');
                  // Fallback to opening in new tab
                  window.open(artistProfile, '_blank');
                }
              } catch (err) {
                console.error('Error in profile button:', err);
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