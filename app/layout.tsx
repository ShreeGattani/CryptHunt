import type { Metadata } from "next";
import { GameProvider } from "./context/GameContext";
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
        <div className="vhs-line"></div>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  );
}
