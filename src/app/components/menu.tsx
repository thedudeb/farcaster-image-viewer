import { useState } from 'react';
import { trackCurateRequest } from '../lib/analytics';

interface MenuProps {
  onClose: () => void;
  onEpochChange: (epochId: number) => void;
  currentEpoch: number;
}

const EPOCHS = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
  { id: 3, name: 'Epoch 3', totalImages: 111 },
  { id: 4, name: 'Epoch 4', totalImages: 0, locked: true },
  { id: 5, name: 'Epoch 5-Greywash', totalImages: 6, locked: false },
];

export default function Menu({ onClose, onEpochChange, currentEpoch }: MenuProps) {
  const handleEpochSelect = (epochId: number) => {
    onEpochChange(epochId);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center">
      <div className="w-64 bg-gray-900 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-xl font-bold">Menu</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-2">
          {EPOCHS.map((epoch) => (
            <button
              key={epoch.id}
              onClick={() => !epoch.locked && handleEpochSelect(epoch.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                epoch.locked
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : currentEpoch === epoch.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>
                  {epoch.name}
                  {!epoch.locked && (
                    <span className="text-sm ml-2 opacity-75">
                      ({epoch.totalImages} images)
                    </span>
                  )}
                </span>
                {epoch.locked && (
                  <span className="text-gray-500">
                    🔒
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
        
        {/* Separator */}
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
            
            try {
              // Import the frame SDK
              const frame = await import('@farcaster/frame-sdk');
              
              if (frame.sdk && frame.sdk.actions) {
                // Use composeCast to open DM composer with random message to @thedude
                console.log('Opening DM composer with random curation request to @thedude');
                await frame.sdk.actions.composeCast({ 
                  text: `@thedude ${randomMessage}`,
                  embeds: ['https://warpcast.com/thedude']
                });
                console.log('Successfully opened DM composer');
              } else {
                console.log('Frame SDK not available, falling back to window.open');
                const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`@thedude ${randomMessage}`)}&embeds[]=${encodeURIComponent('https://warpcast.com/thedude')}`;
                window.open(composeUrl, '_blank');
              }
            } catch (err) {
              console.error('Error opening DM composer:', err);
              const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(`@thedude ${randomMessage}`)}&embeds[]=${encodeURIComponent('https://warpcast.com/thedude')}`;
              window.open(composeUrl, '_blank');
            }
          }}
          className="w-full text-center px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
        >
          Request a Curate
        </button>
      </div>
    </div>
  );
}
