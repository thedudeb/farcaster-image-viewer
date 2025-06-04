import { useState } from 'react';

interface MenuProps {
  onClose: () => void;
  onEpochChange: (epochId: number) => void;
  currentEpoch: number;
}

const EPOCHS = [
  { id: 1, name: 'Epoch 1', totalImages: 77 },
  { id: 2, name: 'Epoch 2', totalImages: 106 },
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
              onClick={() => handleEpochSelect(epoch.id)}
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                currentEpoch === epoch.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              {epoch.name}
              <span className="text-sm ml-2 opacity-75">
                ({epoch.totalImages} images)
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
