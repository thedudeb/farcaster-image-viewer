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
                
                // Try multiple approaches to minimize and open profile
                if (typeof window !== 'undefined' && 'sdk' in window) {
                  const sdk = (window as any).sdk;
                  console.log('SDK available:', sdk);
                  
                  if (sdk && sdk.actions) {
                    console.log('SDK actions available:', Object.keys(sdk.actions));
                    
                    // Try to minimize/close the frame first
                    if (sdk.actions.close) {
                      console.log('Using close() method');
                      sdk.actions.close();
                    } else if (sdk.actions.minimize) {
                      console.log('Using minimize() method');
                      sdk.actions.minimize();
                    } else if (sdk.actions.minimizeFrame) {
                      console.log('Using minimizeFrame() method');
                      sdk.actions.minimizeFrame();
                    }
                    
                    // Wait a bit then open the profile
                    setTimeout(() => {
                      console.log('Opening profile after minimize');
                      
                      // Try farcaster:// URL first
                      const mainClientUrl = artistProfile.replace('https://warpcast.com', 'farcaster://');
                      console.log('Trying farcaster:// URL:', mainClientUrl);
                      
                      // Try to open in main client
                      if (sdk.actions.openUrl) {
                        try {
                          sdk.actions.openUrl(mainClientUrl);
                          console.log('Opened with SDK openUrl');
                        } catch (err) {
                          console.log('SDK openUrl failed, trying window.open:', err);
                          window.open(mainClientUrl, '_blank');
                        }
                      } else {
                        window.open(mainClientUrl, '_blank');
                      }
                    }, 200); // Increased delay
                    
                  } else {
                    console.log('No SDK actions available');
                    window.open(artistProfile, '_blank');
                  }
                } else {
                  console.log('No SDK available');
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