# Farcaster Image Viewer

This is a [Next.js](https://nextjs.org) project with Farcaster Frame integration for webhook handling and notifications.

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Farcaster API Key
NEYNAR_API_KEY=FARCASTER_V2_FRAMES_DEMO

# App URL for notifications
NEXT_PUBLIC_URL=https://your-app-domain.vercel.app
```

Note: KV storage credentials are hardcoded in the project for simplicity.

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Farcaster Frame Features

This project includes:

- **Webhook Endpoint** (`/api/webhook`): Handles Farcaster frame events (frame_added, frame_removed, notifications_enabled/disabled)
- **Send Notification Endpoint** (`/api/send-notification`): Manually send notifications to users
- **KV Storage**: Stores user notification details using Upstash Redis
- **Frame Metadata**: Properly configured Farcaster frame metadata in layout

## API Endpoints

- `POST /api/webhook` - Farcaster webhook handler
- `POST /api/send-notification` - Manual notification sender

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [Farcaster Frames Documentation](https://docs.farcaster.xyz/reference/frames/spec) - learn about Farcaster frames.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Don't forget to add your environment variables in the Vercel project settings!

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
