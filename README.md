# Farcaster Image Viewer

A curated digital art gallery built for the Farcaster community. Experience carefully selected digital art collections through an immersive, interactive gallery with mobile-optimized touch controls.

## ✨ Features

### Image Viewer
- **Multi-Epoch Support**: Browse through 7 different curated epochs with 300+ images
- **Touch Controls**: Pinch-to-zoom, swipe navigation, and haptic feedback
- **Keyboard Navigation**: Arrow keys for desktop users
- **Smart Preloading**: Intelligent image caching for smooth browsing
- **Analytics**: Track user engagement and image views
- **Farcaster Integration**: Share images directly to Warpcast

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd farcaster-image-viewer
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📱 Usage

### Image Viewer (`/`)
- **Navigation**: Tap left/right or use arrow keys to navigate images
- **Zoom**: Pinch to zoom on mobile devices, double-click to reset
- **Menu**: Tap the menu button (top-left) to switch between epochs
- **Share**: Use the share button (top-right) to share images on Farcaster

## 🎨 Epochs

The viewer contains 7 curated epochs:

- **Epoch 1**: 77 images (JPG)
- **Epoch 2**: 106 images (JPG) 
- **Epoch 3**: 111 images (JPG)
- **Epoch 4**: Coming soon (Locked)
- **Epoch 5**: 6 images by @Greywash (JPEG)
- **Epoch 6**: 10 images (PNG) - Locked
- **Epoch -7**: Coming soon by @Chronist (Locked)

## 🛠️ Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript
- **Deployment**: Vercel
- **Analytics**: Custom tracking system
- **Farcaster Integration**: Frame SDK

## 📊 Analytics

The app includes comprehensive analytics tracking:
- Session starts
- Image views
- Epoch completions
- Epoch switches
- Menu interactions

## 🔧 Development

### Project Structure
```
src/
├── app/
│   ├── page.tsx                    # Main image viewer
│   ├── landing-page-backup.tsx     # Saved landing page for future use
│   ├── components/
│   │   ├── menu.tsx               # Epoch selection menu
│   │   └── NotificationWrapper.tsx
│   ├── lib/
│   │   ├── analytics.ts           # Analytics tracking
│   │   └── notifications.ts       # Farcaster notifications
│   └── api/                       # API routes
└── public/
    └── images/                    # Image collections
        ├── epoch1/
        ├── epoch2/
        └── ...
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌟 Features in Detail

### Responsive Design
- Mobile-first approach with touch-optimized controls
- Desktop support with keyboard navigation
- Adaptive layouts for all screen sizes

### Performance Optimizations
- Image preloading and caching
- Debounced analytics tracking
- Memory management for large image collections
- Optimized loading states and transitions

### User Experience
- Smooth animations and transitions
- Haptic feedback on mobile devices
- Intuitive navigation patterns
- Loading indicators and progress feedback

## 🎨 Landing Page (Saved for Future Use)

A beautiful futuristic landing page has been created and saved as `src/app/landing-page-backup.tsx`. This includes:

- **Futuristic Design**: Modern, responsive design with animated backgrounds
- **Interactive Elements**: Mouse-tracking parallax effects and smooth animations
- **Feature Showcase**: Highlighting key app features
- **Image Preview**: Auto-rotating carousel showcasing sample images
- **Call-to-Action**: Prominent buttons and modern UI elements

This landing page can be easily moved to a separate project for future use.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built for the Farcaster community
- Special thanks to @Greywash for Epoch 5 curation
- Inspired by the digital art community

---

**Experience the future of digital art viewing on Farcaster! 🚀**
