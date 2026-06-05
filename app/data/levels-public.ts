/**
 * Public level metadata safe to ship in the browser bundle.
 * Contains NO questions, NO hints, NO answers.
 */
export interface LevelMeta {
  id: number;
  name: string;
  cover: string;
  theme: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  glowClass: string;
  audioHint: string;
}

export const creepypastaLevels: LevelMeta[] = [
  { id: 1, name: "Slender Man", cover: "/images/covers/slenderman.png", theme: "The Whispering Woods", bgColor: "bg-emerald-950/20", textColor: "text-emerald-400", borderColor: "border-emerald-500/30", glowClass: "pulse-cyan-glow", audioHint: "[STATIC WHITE NOISE INTENSIFIES]" },
  { id: 2, name: "Eyeless Jack", cover: "/images/covers/jack.png", theme: "The Operating Theatre", bgColor: "bg-blue-950/20", textColor: "text-blue-400", borderColor: "border-blue-500/30", glowClass: "pulse-cyan-glow", audioHint: "[DRIPPING WET SOUNDS, BREATHING]" },
  { id: 3, name: "Ben Drowned", cover: "/images/covers/ben.png", theme: "The Haunted Cartridge", bgColor: "bg-red-950/20", textColor: "text-red-400", borderColor: "border-red-500/30", glowClass: "pulse-red-glow", audioHint: "[GLITCHED OCARINA REVERSED CHORDS]" },
  { id: 4, name: "The Puppeteer", cover: "/images/covers/puppeteer.png", theme: "The Theater of Shadows", bgColor: "bg-purple-950/20", textColor: "text-purple-400", borderColor: "border-purple-500/30", glowClass: "pulse-red-glow", audioHint: "[CREAKING WOODEN JOINTS, COLD LAUGHTER]" },
  { id: 5, name: "Candle Cove", cover: "/images/covers/candle.png", theme: "The Abandoned Broadcast", bgColor: "bg-neutral-950/20", textColor: "text-neutral-400", borderColor: "border-neutral-500/30", glowClass: "pulse-red-glow", audioHint: "[DISTORTED OCEAN WAVES, STATIC REVERB]" },
];

/** Question shape the client receives from the server — never includes the answer. */
export interface PublicQuestion {
  id: number;
  text: string;
  hint?: string;
  image?: string;
  audio?: string;
  points: number;
  questionNumber: number;
  levelId: number;
}
