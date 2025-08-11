import { useState } from 'react';

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
      </div>
    </div>
  );
}
