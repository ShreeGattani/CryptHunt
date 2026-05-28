import type { Metadata } from "next";
import { GameProvider } from "./context/GameContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypt@trix // Creepypasta Cipher Hunt",
  description: "A cryptographic digital treasure hunt where clues hide in pages, source, files, backlinks, and static-soaked horror screens.",
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
