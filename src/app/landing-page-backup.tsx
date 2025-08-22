'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [currentImage, setCurrentImage] = useState(1)
  const [isLoaded, setIsLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Auto-rotate through sample images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage(prev => prev === 5 ? 1 : prev + 1)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Trigger load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
        }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        
        {/* Hero section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
              FARCASTER
            </h1>
            <h2 className="text-3xl md:text-5xl font-light text-white/90 mb-2">
              Image Viewer
            </h2>
            <p className="text-xl text-cyan-300/80 max-w-2xl mx-auto">
              Experience curated digital art collections through an immersive, interactive gallery
            </p>
          </div>

          {/* CTA Button */}
          <Link 
            href="/viewer"
            className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/25"
          >
            <span className="relative z-10">Launch Viewer</span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full blur opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </div>

        {/* Feature showcase */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full mb-16">
          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Curated Collections</h3>
            <p className="text-gray-300">Explore carefully selected digital art from talented creators across multiple epochs</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Mobile Optimized</h3>
            <p className="text-gray-300">Touch-friendly interface with pinch-to-zoom and smooth navigation</p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-gray-300">Optimized loading with intelligent preloading for seamless browsing</p>
          </div>
        </div>

        {/* Image preview carousel */}
        <div className="relative w-full max-w-4xl mb-16">
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
            <Image
              src={`/images/epoch1/${currentImage}.jpg`}
              alt={`Preview image ${currentImage}`}
              fill
              className="object-cover transition-all duration-500"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <p className="text-sm opacity-75">Epoch 1 • Image {currentImage}</p>
            </div>
          </div>
          
          {/* Navigation dots */}
          <div className="flex justify-center mt-4 space-x-2">
            {[1, 2, 3, 4, 5].map((num) => (
              <button
                key={num}
                onClick={() => setCurrentImage(num)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentImage === num 
                    ? 'bg-cyan-400 scale-125' 
                    : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl w-full mb-16">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">6</div>
            <div className="text-gray-300">Epochs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">300+</div>
            <div className="text-gray-300">Images</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-2">100%</div>
            <div className="text-gray-300">Free</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">24/7</div>
            <div className="text-gray-300">Available</div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400">
          <p className="mb-4">Built for the Farcaster community</p>
          <div className="flex justify-center space-x-6 text-sm">
            <a href="#" className="hover:text-cyan-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-cyan-400 transition-colors">Support</a>
          </div>
        </div>
      </div>

      {/* Animated border effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 border border-cyan-500/20 rounded-none" />
        <div 
          className="absolute inset-0 border border-cyan-400/40 rounded-none"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.1), transparent)`,
            animation: 'borderGlow 3s ease-in-out infinite'
          }}
        />
      </div>

      <style jsx>{`
        @keyframes borderGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}

