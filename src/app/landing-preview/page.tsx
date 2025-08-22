'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPagePreview() {
  const [currentImage, setCurrentImage] = useState(1)

  // Auto-rotate through sample images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => {
        const next = prev >= 5 ? 1 : prev + 1;
        console.log(`Auto-rotating: ${prev} → ${next}`);
        return next;
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden">
      {/* Simple background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        
        {/* Hero section */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            FARCASTER
          </h1>
          <h2 className="text-3xl md:text-5xl font-light text-white/90 mb-2">
            Image Viewer
          </h2>
          <p className="text-xl text-cyan-300/80 max-w-2xl mx-auto mb-8">
            Experience curated digital art collections through an immersive, interactive gallery
          </p>

          {/* CTA Button */}
          <Link 
            href="/"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg rounded-full hover:scale-105 transition-all duration-300"
          >
            Launch Viewer
          </Link>
        </div>

        {/* Simple image carousel */}
        <div className="relative w-full max-w-4xl mb-16">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
            <Image
              key={`epoch1-${currentImage}`}
              src={`/images/epoch1/${currentImage}.jpg`}
              alt={`Preview image ${currentImage} from Epoch 1`}
              fill
              className="object-cover transition-all duration-500"
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              onLoad={() => console.log(`Loaded image ${currentImage}`)}
              onError={(e) => {
                console.error(`Failed to load image ${currentImage}:`, e);
                setTimeout(() => {
                  setCurrentImage(prev => prev >= 5 ? 1 : prev + 1);
                }, 1000);
              }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm opacity-75">Epoch 1 • Image {currentImage}/5</p>
            </div>
          </div>
          
          {/* Navigation dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => {
                  setCurrentImage(num);
                  console.log(`Clicked dot ${num}, setting image to ${num}`);
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                  currentImage === num 
                    ? 'bg-cyan-400 scale-125 shadow-lg shadow-cyan-400/50' 
                    : 'bg-white/30 hover:bg-white/50 hover:scale-110'
                }`}
                title={`View image ${num}`}
              />
            ))}
          </div>
        </div>

        {/* Simple stats */}
        <div className="text-center text-white mb-12">
          <p>7 Epochs • 300+ Images • 100% Free</p>
        </div>

        {/* Featured Artists */}
        <div className="text-center mb-12">
          <h3 className="text-2xl font-semibold text-white mb-6">Featured Artists</h3>
          <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <p className="text-cyan-300 font-medium">Chronist</p>
              <p className="text-gray-400 text-sm">Epoch -7</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                A
              </div>
              <p className="text-purple-300 font-medium">Artist 2</p>
              <p className="text-gray-400 text-sm">Epoch 1</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                C
              </div>
              <p className="text-green-300 font-medium">Creator 3</p>
              <p className="text-gray-400 text-sm">Epoch 2</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                D
              </div>
              <p className="text-orange-300 font-medium">Designer 4</p>
              <p className="text-gray-400 text-sm">Epoch 3</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                V
              </div>
              <p className="text-indigo-300 font-medium">Visualist 5</p>
              <p className="text-gray-400 text-sm">Epoch 5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
