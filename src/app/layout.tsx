import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { FrameInit } from "./components/FrameInit";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const revalidate = 300;

const frame = {
  version: "next",
  imageUrl: "https://imgur.com/cgu3wgB.png",
  button: {
    title: "Universe and Everything",
    action: {
      type: "launch_frame",
      name: "0ffline Viewer",
      url: "https://farcaster-image-viewer.vercel.app",
      splashImageUrl: "https://imgur.com/cgu3wgB.png",
      splashBackgroundColor: "#eeccff",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "0ffline Viewer",
    description: "Universe and Everything",
    openGraph: {
      title: "0ffline Viewer",
      description: "Universe and Everything",
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    }
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <FrameInit />
      </body>
    </html>
  );
}
