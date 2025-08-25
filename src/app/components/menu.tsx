import { useState, useEffect } from 'react';
import Image from 'next/image';
import { trackCurateRequest, trackArtistProfileClick } from '../lib/analytics';

interface MenuProps {
  onClose: () => void;
  onEpochChange: (epochId: number) => void;
  currentEpoch: number;
}

// Artist data for each epoch
const EPOCH_ARTISTS = {
  1: { 
    fid: 15351, 
    username: '0ffline', 
    displayName: '0ffline'
  },
  2: { 
    fid: 15351, 
    username: '0ffline', 
    displayName: '0ffline'
  },
  3: { 
    fid: 15351, 
    username: '0ffline', 
    displayName: '0ffline'
  },
  4: { 
    fid: 15351, 
    username: '0ffline', 
    displayName: '0ffline'
  },
  5: { 
    fid: 1075107, 
    username: 'greywash', 
    displayName: 'Greywash'
  },
  6: { 
    fid: 288204, 
    username: 'dwn2earth', 
    displayName: 'dwn2earth'
  },
  7: { 
    fid: 499579, 
    username: 'chronist', 
    displayName: 'Chronist'
  },
};

const EPOCHS = [
  { id: 5, name: 'Epoch 5', totalImages: 6, locked: false },
  { id: 6, name: 'Epoch 6', totalImages: 10, locked: true },
  { id: 7, name: 'Epoch 7', totalImages: 45, locked: true },
];

const EPOCHS_1_TO_4 = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
  { id: 3, name: 'Epoch 3', totalImages: 111 },
  { id: 4, name: 'Epoch 4', totalImages: 0, locked: true },
];

export default function Menu({ onClose, onEpochChange, currentEpoch }: MenuProps) {
  const [profilePictures, setProfilePictures] = useState<Record<number, string>>({});
  const [loadingPictures, setLoadingPictures] = useState(true);
  const [epoch6Taps, setEpoch6Taps] = useState(0);
  const [epoch6Unlocked, setEpoch6Unlocked] = useState(false);
  const [unlockAnimation, setUnlockAnimation] = useState(false);
  const [showEpoch1To4Submenu, setShowEpoch1To4Submenu] = useState(false);

  // Fetch profile pictures from Neynar API
  useEffect(() => {
    const fetchProfilePictures = async () => {
      try {
        const fids = Object.values(EPOCH_ARTISTS).map(artist => artist.fid);
        const uniqueFids = [...new Set(fids)]; // Remove duplicates
        
        console.log('Fetching profile pictures for FIDs:', uniqueFids);
        
        const response = await fetch('/api/artists/recent');
        if (response.ok) {
          const data = await response.json();
          const pictures: Record<number, string> = {};
          
          // Map FIDs to profile pictures
          data.artists?.forEach((artist: { fid: number; pfp: string }) => {
            pictures[artist.fid] = artist.pfp;
            console.log(`Loaded profile picture for FID ${artist.fid}:`, artist.pfp ? 'Success' : 'No URL');
          });
          
          console.log('Profile pictures loaded:', Object.keys(pictures));
          setProfilePictures(pictures);
        } else {
          console.error('Failed to fetch artists:', response.status, await response.text());
        }
      } catch (error) {
        console.error('Failed to fetch profile pictures:', error);
      } finally {
        setLoadingPictures(false);
      }
    };

    fetchProfilePictures();
  }, []);

  const handleEpochSelect = (epochId: number) => {
    onEpochChange(epochId);
  };

  const handleEpoch6Tap = () => {
    if (epoch6Unlocked) return; // Already unlocked
    
    const newTapCount = epoch6Taps + 1;
    setEpoch6Taps(newTapCount);
    
    if (newTapCount >= 5) {
      // Trigger unlock animation
      setUnlockAnimation(true);
      
      // Unlock after animation starts
      setTimeout(() => {
        setEpoch6Unlocked(true);
        setUnlockAnimation(false);
        setEpoch6Taps(0);
      }, 500);
    }
    
    // Reset tap count after 3 seconds if not completed
    setTimeout(() => {
      setEpoch6Taps(0);
    }, 3000);
  };

  const handleArtistClick = async (e: React.MouseEvent, artist: typeof EPOCH_ARTISTS[1]) => {
    e.stopPropagation(); // Prevent epoch selection when clicking artist
    
    // Track artist profile click
    trackArtistProfileClick(`@${artist.username}`);
    
    try {
      // Import the frame SDK
      const frame = await import('@farcaster/frame-sdk');
      
      if (frame.sdk && frame.sdk.actions) {
        // Use the official viewProfile method with FID
        if (frame.sdk.actions.viewProfile) {
          await frame.sdk.actions.viewProfile({ fid: artist.fid });
        } else {
          // Fallback to openUrl with farcaster:// scheme
          const profileUrl = `farcaster://profile/${artist.username}`;
          await frame.sdk.actions.openUrl(profileUrl);
        }
      } else {
        // Fallback to web URL
        const profileUrl = `https://warpcast.com/${artist.username}`;
        window.open(profileUrl, '_blank');
      }
    } catch (err) {
      console.error('Error opening artist profile:', err);
      // Final fallback
      const profileUrl = `https://warpcast.com/${artist.username}`;
      window.open(profileUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center">
      <div className="w-96 bg-gray-900 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {showEpoch1To4Submenu ? 'Epoch 1-4' : 'Menu'}
          </h2>
          <button
            onClick={showEpoch1To4Submenu ? () => setShowEpoch1To4Submenu(false) : onClose}
            className="text-white hover:text-gray-300"
          >
            {showEpoch1To4Submenu ? '←' : '✕'}
          </button>
        </div>
        
        <div className="space-y-2">
          {/* Artist profile hint */}
          <div className="text-xs text-gray-400 mb-2 px-1">
            💡 Click artist profile images to view their Farcaster profile
          </div>
          
                    {showEpoch1To4Submenu ? (
            // Sub-menu: Show Epochs 1-4
            EPOCHS_1_TO_4.map((epoch) => {
              const artist = EPOCH_ARTISTS[epoch.id as keyof typeof EPOCH_ARTISTS];
              
              return (
                <button
                  key={epoch.id}
                  onClick={() => {
                    if (!epoch.locked) {
                      handleEpochSelect(epoch.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                    epoch.locked
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : currentEpoch === epoch.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Artist Profile Image */}
                      {artist && (
                        <div 
                          className="relative flex-shrink-0"
                          onClick={!epoch.locked ? (e) => handleArtistClick(e, artist) : undefined}
                        >
                          {loadingPictures ? (
                            // Loading skeleton
                            <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse ring-2 ring-gray-600"></div>
                          ) : profilePictures[artist.fid] ? (
                            // Real profile picture
                            <Image
                              src={profilePictures[artist.fid]}
                              alt={`@${artist.username}`}
                              width={36}
                              height={36}
                              className={`rounded-full transition-all duration-200 ring-2 ${
                                epoch.locked 
                                  ? 'ring-gray-600 opacity-60 cursor-not-allowed' 
                                  : 'cursor-pointer hover:opacity-80 hover:scale-105 ring-gray-700 hover:ring-blue-500'
                              }`}
                              title={epoch.locked ? `@${artist.username} (locked)` : `View @${artist.username}'s profile`}
                              onError={(e) => {
                                console.log(`Image failed to load for ${artist.username}:`, profilePictures[artist.fid]);
                                // Fallback to a simple colored circle with initials
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log(`Image loaded successfully for ${artist.username}`);
                              }}
                            />
                          ) : null}
                          {/* Fallback avatar with initials */}
                          <div 
                            className={`${profilePictures[artist.fid] ? 'hidden' : 'flex'} w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white text-xs font-bold transition-all duration-200 ring-2 ${
                              epoch.locked 
                                ? 'ring-gray-600 opacity-60 cursor-not-allowed' 
                                : 'cursor-pointer hover:opacity-80 hover:scale-105 ring-gray-700 hover:ring-blue-500'
                            }`}
                            title={epoch.locked ? `@${artist.username} (locked)` : `View @${artist.username}'s profile`}
                          >
                            {artist.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          {/* Small indicator that it's clickable (only when not locked) */}
                          {!epoch.locked && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {epoch.name}
                        </span>
                        <span className={`text-sm ${epoch.locked ? 'text-gray-500' : 'opacity-75'}`}>
                          by @{artist?.username} {!epoch.locked && `• ${epoch.totalImages} images`}
                        </span>
                      </div>
                    </div>
                    
                    {epoch.locked && (
                      <span className="text-gray-500">
                        🔒
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            // Main menu: Show consolidated Epoch 1-4 and other epochs
            <>
              {/* Epoch 1-4 consolidated option */}
              <button
                onClick={() => setShowEpoch1To4Submenu(true)}
                className="w-full text-left px-4 py-3 rounded-lg transition-all duration-300 text-gray-300 hover:bg-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Artist Profile Image for 0ffline (Epoch 1-4 artist) */}
                    <div className="relative flex-shrink-0">
                      {loadingPictures ? (
                        // Loading skeleton
                        <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse ring-2 ring-gray-600"></div>
                      ) : profilePictures[15351] ? (
                        // Real profile picture
                        <Image
                          src={profilePictures[15351]}
                          alt="@0ffline"
                          width={36}
                          height={36}
                          className="rounded-full transition-all duration-200 ring-2 ring-gray-700 hover:ring-blue-500 cursor-pointer hover:opacity-80 hover:scale-105"
                          title="View @0ffline's profile"
                          onError={(e) => {
                            console.log(`Image failed to load for @0ffline:`, profilePictures[15351]);
                            // Fallback to a simple colored circle with initials
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                          onLoad={() => {
                            console.log(`Image loaded successfully for @0ffline`);
                          }}
                        />
                      ) : null}
                      {/* Fallback avatar with initials */}
                      <div 
                        className={`${profilePictures[15351] ? 'hidden' : 'flex'} w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white text-xs font-bold transition-all duration-200 ring-2 ring-gray-700 hover:ring-blue-500 cursor-pointer hover:opacity-80 hover:scale-105`}
                        title="View @0ffline's profile"
                      >
                        0
                      </div>
                      {/* Small indicator that it's clickable */}
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="font-medium">
                        Epoch 1-4
                      </span>
                      <span className="text-sm opacity-75">
                        by @0ffline • 294 images
                      </span>
                    </div>
                  </div>
                  
                  <span className="text-gray-400">
                    →
                  </span>
                </div>
              </button>
              
                             {/* Other epochs */}
               {EPOCHS.map((epoch) => {
                 const artist = EPOCH_ARTISTS[epoch.id as keyof typeof EPOCH_ARTISTS];
                 
                 return (
                   <button
                     key={epoch.id}
                     onClick={() => {
                       if (epoch.id === 6 && !epoch6Unlocked) {
                         handleEpoch6Tap();
                       } else if (!epoch.locked || (epoch.id === 6 && epoch6Unlocked)) {
                         handleEpochSelect(epoch.id);
                       }
                     }}
                     className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 relative overflow-hidden ${
                       epoch.id === 6 && unlockAnimation
                         ? 'bg-green-600 text-white scale-105 shadow-lg'
                         : epoch.locked
                         ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                         : currentEpoch === epoch.id
                         ? 'bg-blue-600 text-white'
                         : 'text-gray-300 hover:bg-gray-800'
                     }`}
                   >
                     {/* Progress bar for Epoch 6 easter egg */}
                     {epoch.id === 6 && !epoch6Unlocked && epoch6Taps > 0 && (
                       <div 
                         className="absolute inset-0 bg-green-600 transition-all duration-300 ease-out"
                         style={{ 
                           width: `${(epoch6Taps / 5) * 100}%`,
                           zIndex: 1
                         }}
                       />
                     )}
                     <div className="relative z-10">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           {/* Artist Profile Image */}
                           {artist && (
                             <div 
                               className="relative flex-shrink-0"
                               onClick={!epoch.locked ? (e) => handleArtistClick(e, artist) : undefined}
                             >
                               {loadingPictures ? (
                                 // Loading skeleton
                                 <div className="w-9 h-9 rounded-full bg-gray-700 animate-pulse ring-2 ring-gray-600"></div>
                               ) : profilePictures[artist.fid] ? (
                                 // Real profile picture
                                 <Image
                                   src={profilePictures[artist.fid]}
                                   alt={`@${artist.username}`}
                                   width={36}
                                   height={36}
                                   className={`rounded-full transition-all duration-200 ring-2 ${
                                     epoch.locked 
                                       ? 'ring-gray-600 opacity-60 cursor-not-allowed' 
                                       : 'cursor-pointer hover:opacity-80 hover:scale-105 ring-gray-700 hover:ring-blue-500'
                                   }`}
                                   title={epoch.locked ? `@${artist.username} (locked)` : `View @${artist.username}'s profile`}
                                   onError={(e) => {
                                     console.log(`Image failed to load for ${artist.username}:`, profilePictures[artist.fid]);
                                     // Fallback to a simple colored circle with initials
                                     const target = e.target as HTMLImageElement;
                                     target.style.display = 'none';
                                     const fallback = target.nextElementSibling as HTMLElement;
                                     if (fallback) fallback.style.display = 'flex';
                                   }}
                                   onLoad={() => {
                                     console.log(`Image loaded successfully for ${artist.username}`);
                                   }}
                                 />
                               ) : null}
                               {/* Fallback avatar with initials */}
                               <div 
                                 className={`${profilePictures[artist.fid] ? 'hidden' : 'flex'} w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 items-center justify-center text-white text-xs font-bold transition-all duration-200 ring-2 ${
                                   epoch.locked 
                                     ? 'ring-gray-600 opacity-60 cursor-not-allowed' 
                                     : 'cursor-pointer hover:opacity-80 hover:scale-105 ring-gray-700 hover:ring-blue-500'
                                 }`}
                                 title={epoch.locked ? `@${artist.username} (locked)` : `View @${artist.username}'s profile`}
                               >
                                 {artist.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                               </div>
                               {/* Small indicator that it's clickable (only when not locked) */}
                               {!epoch.locked && (
                                 <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-gray-900 shadow-sm"></div>
                               )}
                             </div>
                           )}
                           
                           <div className="flex flex-col">
                             <span className="font-medium">
                               {epoch.name}
                             </span>
                             <span className={`text-sm ${epoch.locked ? 'text-gray-500' : 'opacity-75'}`}>
                               by @{artist?.username} {!epoch.locked && `• ${epoch.totalImages} images`}
                             </span>
                           </div>
                         </div>
                         
                         {epoch.locked && (
                           <span className="text-gray-500">
                             🔒
                           </span>
                         )}
                         {epoch.id === 6 && !epoch6Unlocked && (
                           <span className={`text-gray-500 transition-all duration-300 ${unlockAnimation ? 'scale-125 text-green-400' : ''}`}>
                             🔒
                           </span>
                         )}
                         {epoch.id === 6 && epoch6Unlocked && (
                           <span className="text-green-400 animate-pulse">
                             🔓
                           </span>
                         )}
                       </div>
                     </div>
                   </button>
                 );
               })}
             </>
           )}
         </div>
        
        {/* Separator and Request a Curate Button - only show in main menu */}
        {!showEpoch1To4Submenu && (
          <>
            <div className="border-t border-gray-700 my-4"></div>
            
            {/* Request a Curate Button */}
            <button
          onClick={async () => {
            // Track the curate request
            trackCurateRequest();
            
            // Random curation request messages
            const curationMessages = [
              "Hey dude, I rolled this joint for you, can you please add me to the curation list",
              "I saw you across the forest, and now I want to be on the 0ffline viewer mini app with my artwork",
              "I baked you a lasagna, but the only ingredient missing, dude, is my art on the 0ffline viewer mini app.",
              "I'm currently in a canoe, dude, in a fountain, waiting for you to feature my work.",
              "I just high-fived a stranger who promised, dude, you'd put me on the curation list.",
              "Here, dude I made you a friendship bracelet, it also doubles as a contract to feature my work.",
              "I just finished knitting a scarf for your soul, dude. Payment? Just put me on the list.",
              "I've been standing dramatically in the rain rehearsing this request — please add my art, dude."
            ];
            
            // Pick a random message
            const randomMessage = curationMessages[Math.floor(Math.random() * curationMessages.length)];
            
            // Create the compose URL with the message and app embed
            const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`@thedude ${randomMessage}`)}&embeds[]=${encodeURIComponent(window.location.origin)}`;
            
            try {
              // Import the frame SDK
              const frame = await import('@farcaster/frame-sdk');
              
                              if (frame.sdk && frame.sdk.actions) {
                  // Use the standard openUrl method with the compose URL
                  console.log('Opening cast composer with curation request');
                  await frame.sdk.actions.openUrl(composeUrl);
                  console.log('Successfully opened cast composer');
                } else {
                console.log('Frame SDK not available, falling back to window.open');
                window.open(composeUrl, '_blank');
              }
            } catch (err) {
              console.error('Error opening cast composer:', err);
              // Fallback to window.open
              window.open(composeUrl, '_blank');
            }
          }}
          className="w-full text-center px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
        >
          Request a Curate
        </button>
          </>
        )}
      </div>
    </div>
  );
}
