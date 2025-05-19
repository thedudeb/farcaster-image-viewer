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

export const metadata: Metadata = {
  title: "0ffline Viewer",
  description: "Universe and Everything",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://imgur.com/a/tg1AwkM.png",
      button: {
        title: "Universe and Everything",
        action: {
          type: "launch_frame",
          url: "https://farcaster-image-viewer.vercel.app/",
          name: "0ffline Viewer",
          splashImageUrl: "https://imgur.com/a/tg1AwkM",
          splashBackgroundColor: "#eeccff ",
        },
      },
    }),
  }


};

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
