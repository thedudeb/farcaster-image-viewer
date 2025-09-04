import { useState, useEffect } from 'react';
import Image from 'next/image';
import { sdk } from '@farcaster/miniapp-sdk';
import { trackCurateRequest, trackArtistProfileClick } from '../lib/analytics';

interface MenuProps {
  onClose: () => void;
  onEpochChange: (epochId: number) => void;
  currentEpoch: number;
  onChronistEasterEgg: () => void;
  chronistTapCount: number;
  chronistEpochUnlocked: boolean;
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

// Set a fixed unlock timestamp for Chronist's epoch (same as main page)
// September 9th, 2025 at 4:20 PM EST (9:20 PM UTC)
const EPOCH_7_UNLOCK_TIME = new Date('2025-09-09T21:20:00Z').getTime(); // 4:20 PM EST = 9:20 PM UTC

// FOR TESTING: Uncomment the line below to test with a 30-second countdown
// const EPOCH_7_UNLOCK_TIME = Date.now() + (30 * 1000); // 30 seconds for testing

const EPOCHS = [
  { id: 5, name: 'Epoch 5', totalImages: 6, locked: false },
  { id: 6, name: 'Epoch 6', totalImages: 10, locked: false },
  { 
    id: 7, 
    name: 'Epoch 7', 
    totalImages: 45, 
    locked: true,
    unlockTime: EPOCH_7_UNLOCK_TIME,
    unlockDate: (() => {
      const date = new Date(EPOCH_7_UNLOCK_TIME);
      const dateStr = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'America/New_York',
        timeZoneName: 'short'
      });
      return `${dateStr} at 4:20 EST`;
    })()
  },
];

const EPOCHS_1_TO_4 = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
  { id: 3, name: 'Epoch 3', totalImages: 111 },
  { id: 4, name: 'Epoch 4', totalImages: 0, locked: true },
];

// Utility functions for countdown timer
const isEpochUnlocked = (epoch: typeof EPOCHS[0], chronistUnlocked: boolean = false): boolean => {
  if (!epoch.locked) return true;
  if (!epoch.unlockTime) return false;
  
  // Special case for Chronist's epoch - can be unlocked via easter egg
  if (epoch.id === 7 && chronistUnlocked) return true;
  
  return Date.now() >= epoch.unlockTime;
};

const getTimeUntilUnlock = (unlockTime: number): { days: number; hours: number; minutes: number; seconds: number } => {
  const timeRemaining = unlockTime - Date.now();
  if (timeRemaining <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
};

export default function Menu({ onClose, onEpochChange, currentEpoch, onChronistEasterEgg, chronistTapCount, chronistEpochUnlocked }: MenuProps) {
  const [profilePictures, setProfilePictures] = useState<Record<number, string>>({});
  const [countdownTimers, setCountdownTimers] = useState<Record<number, { days: number; hours: number; minutes: number; seconds: number }>>({});
  const [loadingPictures, setLoadingPictures] = useState(true);
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

  // Countdown timer for locked epochs
  useEffect(() => {
    const updateCountdowns = () => {
      const newCountdownTimers: Record<number, { days: number; hours: number; minutes: number; seconds: number }> = {};
      
      EPOCHS.forEach(epoch => {
        if (epoch.locked && epoch.unlockTime && !isEpochUnlocked(epoch)) {
          newCountdownTimers[epoch.id] = getTimeUntilUnlock(epoch.unlockTime);
        }
      });
      
      setCountdownTimers(newCountdownTimers);
    };
    
    // Update immediately
    updateCountdowns();
    
    // Then update every second
    const interval = setInterval(updateCountdowns, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleEpochSelect = (epochId: number) => {
    onEpochChange(epochId);
  };



  const handleArtistClick = async (e: React.MouseEvent, artist: typeof EPOCH_ARTISTS[1]) => {
    e.stopPropagation(); // Prevent epoch selection when clicking artist
    
    // Track artist profile click
    trackArtistProfileClick(`@${artist.username}`);
    
          try {
        // Use the new Mini App SDK
        if (sdk && sdk.actions) {
          // Use the official viewProfile method with FID
          if (sdk.actions.viewProfile) {
            await sdk.actions.viewProfile({ fid: artist.fid });
          } else {
            // Fallback to openUrl with farcaster:// scheme
            const profileUrl = `farcaster://profile/${artist.username}`;
            await sdk.actions.openUrl(profileUrl);
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
      <div className="w-96 bg-gray-900 p-4 rounded-lg menu-slide-in shadow-2xl border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">
            {showEpoch1To4Submenu ? 'Epoch 1-4' : 'Menu'}
          </h2>
          <button
            onClick={showEpoch1To4Submenu ? () => setShowEpoch1To4Submenu(false) : onClose}
            className="text-white hover:text-gray-300 menu-button-smooth hover:scale-110 hover:rotate-90"
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
            EPOCHS_1_TO_4.map((epoch, index) => {
              const artist = EPOCH_ARTISTS[epoch.id as keyof typeof EPOCH_ARTISTS];
              
              return (
                <button
                  key={epoch.id}
                  onClick={() => {
                    if (!epoch.locked) {
                      handleEpochSelect(epoch.id);
                    }
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg relative overflow-hidden menu-button-stagger menu-button-smooth ${
                    epoch.locked
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : currentEpoch === epoch.id
                      ? 'bg-blue-600 text-white shadow-blue-500/25'
                      : 'text-gray-300 hover:bg-gray-800 hover:shadow-gray-500/25'
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
                className="w-full text-left px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 menu-button-stagger menu-button-smooth"
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
               {EPOCHS.map((epoch, index) => {
                 const artist = EPOCH_ARTISTS[epoch.id as keyof typeof EPOCH_ARTISTS];
                 const isUnlocked = isEpochUnlocked(epoch, chronistEpochUnlocked);
                 const countdown = countdownTimers[epoch.id];
                 
                 return (
                   <button
                     key={epoch.id}
                     onClick={() => {
                       if (isUnlocked) {
                         handleEpochSelect(epoch.id);
                       } else if (epoch.id === 7) {
                         // Chronist easter egg - trigger on tap
                         onChronistEasterEgg();
                       }
                     }}
                     className={`w-full text-left px-4 py-3 rounded-lg relative overflow-hidden menu-button-stagger menu-button-smooth ${
                       !isUnlocked && epoch.id !== 7
                         ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                         : !isUnlocked && epoch.id === 7
                         ? 'bg-purple-800/50 text-purple-300 hover:bg-purple-700/50 cursor-pointer border border-purple-500/30'
                         : currentEpoch === epoch.id
                         ? 'bg-blue-600 text-white shadow-blue-500/25'
                         : 'text-gray-300 hover:bg-gray-800 hover:shadow-gray-500/25'
                     }`}
                   >

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
                             <span className={`text-sm ${!isUnlocked ? 'text-gray-500' : 'opacity-75'}`}>
                               by @{artist?.username} {isUnlocked && `• ${epoch.totalImages} images`}
                             </span>
                             {/* Countdown timer for locked epochs */}
                             {!isUnlocked && countdown && (
                               <span className="text-xs mt-1 text-orange-400 font-mono">
                                 Unlocks in: {countdown.days}d {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                               </span>
                             )}
                             {!isUnlocked && epoch.unlockDate && (
                               <span className="text-xs mt-1 opacity-60">
                                 {epoch.unlockDate}
                               </span>
                             )}
                           </div>
                         </div>
                         
                         {!isUnlocked && (
                           <div className="flex flex-col items-center text-gray-500">
                             <span className="text-lg">🔒</span>
                             <span className="text-xs mt-1">Locked</span>
                           </div>
                         )}
                       </div>
                     </div>
                   </button>
                 );
               })}
             </>
           )}
         </div>
        
        {/* Separator and Request an Epoch Button - only show in main menu */}
        {!showEpoch1To4Submenu && (
          <>
            <div className="border-t border-gray-700 my-4"></div>
            
            {/* Request an Epoch Button */}
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
              // Use the new Mini App SDK
              if (sdk && sdk.actions) {
                // Use the standard openUrl method with the compose URL
                console.log('Opening cast composer with curation request');
                await sdk.actions.openUrl(composeUrl);
                console.log('Successfully opened cast composer');
              } else {
                console.log('Mini App SDK not available, falling back to window.open');
                window.open(composeUrl, '_blank');
              }
            } catch (err) {
              console.error('Error opening cast composer:', err);
              // Fallback to window.open
              window.open(composeUrl, '_blank');
            }
          }}
          className="w-full text-center px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium menu-button-stagger menu-button-smooth"
        >
          Request an Epoch
        </button>
          </>
        )}
      </div>
    </div>
  );
}
