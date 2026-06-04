import type { Metadata } from "next";
import Script from "next/script";
import { GameProvider } from "./context/GameContext";
import LockGuard from "../components/LockGuard";
import { AudioProvider } from "../components/AudioManager";
import "./globals.css";
import "../components/topbar.css";
import "../components/QuestionProgressBar.css";


export const metadata: Metadata = {
  title: "Crypthunt // Creepypasta Digital Labyrinth",
  description: "A cryptographic digital treasure hunt through five dark levels of internet folklore. Face Slender Man, Eyeless Jack, Ben Drowned, Puppeteer, and Candle Cove.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased no-scrollbar">
      <body className="min-h-full bg-zinc-950 text-zinc-100 flex flex-col font-sans crt-overlay selection:bg-red-950 selection:text-red-300">
        {/*
          Bot-detection: runs before React hydrates (beforeInteractive strategy).
          Next.js hoists this to <head> regardless of where it sits in JSX.
          Sets window.__b = 1 if navigator.webdriver is true — Playwright, Puppeteer,
          and Selenium all expose this flag. GameContext reads __b on first mount and
          switches to scrambled question rendering for that session.
        */}
        <Script
          id="bd"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{if(navigator.webdriver||window.callPhantom||(document.documentElement&&document.documentElement.getAttribute('webdriver'))){window.__b=1;}}catch(e){}`,
          }}
        />
        <div className="vhs-line"></div>
        <AudioProvider>
          <GameProvider>
            <LockGuard>
              {children}
            </LockGuard>
          </GameProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
