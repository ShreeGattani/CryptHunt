/**
 * SERVER-ONLY. Never import this file from any "use client" component.
 * All answer data lives exclusively here and is never sent to the browser.
 */

interface Question {
  id: number;
  text?: string;
  hint?: string;
  image?: string;
  audio?: string;
  file?: string;
  answer: string;
  points: number;
}

interface LevelData {
  id: number;
  name: string;
  cover: string;
  theme: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  glowClass: string;
  audioHint: string;
  questions: Question[];
}

const creepypastaLevels: LevelData[] = [
  {
    id: 1,
    name: "Slender Man",
    cover: "/images/covers/slenderman.png",
    theme: "The Whispering Woods",
    bgColor: "bg-emerald-950/20",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    glowClass: "pulse-cyan-glow",
    audioHint: "[STATIC WHITE NOISE INTENSIFIES]",
    questions: [
      { id: 1, image:"/images/material/download.png", answer: "marble", points: 100 },
      { id: 2, text: "The proxies knew the truth long before the witnesses.", audio:"/images/material/entry08.wav", answer: "tuscaloosa", points: 100 },
      { id: 3, text: "It's not what is visible\n It is what it wanted\n https://youtu.be/MtN1YnoL46Q", answer: "seth", points: 100 },
      { id: 4, file:"/images/material/phonebackup.zip", answer: "believers", points: 100 },
      { id: 5, text: "Every year on 5 November, he posted the same photograph.\n Never explained.\n Never missed a year.\nI don't think it was a coincidence. I think it was a clue.\n He was a fan of cricket. And he hated calling people by their real names.", answer: "brian", points: 100 },
      { id: 6, text: "/879",  answer: "knight", points: 100 },
    ],
  },
  {
    id: 2,
    name: "Eyeless Jack",
    cover: "/images/covers/jack.png",
    theme: "The Operating Theatre",
    bgColor: "bg-blue-950/20",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/30",
    glowClass: "pulse-cyan-glow",
    audioHint: "[DRIPPING WET SOUNDS, BREATHING]",
    questions: [
      // Q1: ASCII sequence spells "Jack Nylas" → hunt leads through /jacknylas → kidney
      { id: 1, text: "74 97 99 107 32 78 121 108 97 115", answer: "kidney", points: 100 },
      // Q2: frame.xyz cipher chain → /warding spectrogram → A1Z26 → PARASITE
      { id: 2, text: "frame.xyz\nthe static has ruined the file\nyou must restore it", answer: "parasite", points: 100 },
      // Q3: log.png + pastebin → beginnings of every step → EDWIN dead end + MITCH dead end → brothers
      { id: 3, text: "seek the beginnings of every step or the numbers?", image: "/images/material/log.png", answer: "brothers", points: 100 },
      // Q4: autopsy.png — answer TBD, fill in before hunt
      { id: 4, image: "/images/material/autopsy.png", answer: "TODO_FILL_ANSWER", points: 100 },
      // Q5: shifted from Ben Drowned — /apple rickroll → rick astley → never gonna give you up
      { id: 5, text: "A for?", answer: "rickastley", points: 100 },
      // Q6: shifted from Puppeteer Q1 — Phineas and Ferb cipher chain → perry
      { id: 6, text: "'Everything's better in Boston'\n 65+55+82+121+78+122+69+99 finding a good way to spend it", answer: "perry", points: 100 },
    ],
  },
  {
    id: 3,
    name: "Ben Drowned",
    cover: "/images/covers/ben.png",
    theme: "The Haunted Cartridge",
    bgColor: "bg-red-950/20",
    textColor: "text-red-400",
    borderColor: "border-red-500/30",
    glowClass: "pulse-red-glow",
    audioHint: "[GLITCHED OCARINA REVERSED CHORDS]",
    questions: [
      { id: 1, text: "The children remembered the episode. The episode remembered them.", file:"/images/material/phonebackup.zip", answer: "viewer", points: 100 },
      { id: 2, text: "I was a young boy who met a watery end. What element took my life and now floods your game files?", image:"/images/material/audience.png", answer: "water", points: 220 },
      { id: 3, text: "When the game glitches, an eerie, hollow statue of Link spawns, tracking your movements. What is the name of this creepy statue/song item?", answer: "emptiness", points: 250 },
      { id: 4, text: "Ben displays a reversed text warning: 'TAHT ENOD EVAH T'NDLUOHS UOY'. What is the corrected sentence?", answer: "you shouldn't have done that", points: 300 },
      { id: 5, text: "What is the alias of the creepy old seller who handed over the cursed cartridge to Jadusable?", answer: "old man", points: 320 },
      { id: 6, text: "What beautiful but eerie ocarina melody, when played in reverse, triggers my presence and digital drowning?", answer: "healing", points: 400 },
    ],
  },
  {
    id: 4,
    name: "The Puppeteer",
    cover: "/images/covers/puppeteer.png",
    theme: "The Theater of Shadows",
    bgColor: "bg-purple-950/20",
    textColor: "text-purple-400",
    borderColor: "border-purple-500/30",
    glowClass: "pulse-red-glow",
    audioHint: "[CREAKING WOODEN JOINTS, COLD LAUGHTER]",
    questions: [
      { id: 1, text: "'Everything's better in Boston'\n 65+55+82+121+78+122+69+99 finding a good way to spend it", answer: "perry", points: 100 },
      { id: 2, text: "Do you remember your password?\n Maybe I left something for you there :)", answer: "navya", points: 100 },
      { id: 3, text: "01101001 01110011 01101110 00100111 01110100 00100000 01110100 01101000 01100101 00100000 01101101 01101111 01101111 01101110 00100000 01101100 01101111 01110110 01100101 01101100 01111001 00111111", answer: "monday", points: 100 },
      { id: 4, text: ":3", answer: "chipmunks", points: 100 },
      { id: 5, text: "Shark tank but not shark tank", answer: "shikarishambhu", points: 100 },
      { id: 6, text: "I may be in SNU now but heart still goes back to GUdXdcfK \n Remember who was the best mod? :P", answer: "mcflurry", points: 100 },
    ],
  },
  {
    id: 5,
    name: "Candle Cove",
    cover: "/images/covers/candle.png",
    theme: "The Abandoned Broadcast",
    bgColor: "bg-neutral-950/20",
    textColor: "text-neutral-400",
    borderColor: "border-neutral-500/30",
    glowClass: "pulse-red-glow",
    audioHint: "[DISTORTED OCEAN WAVES, STATIC REVERB]",
    questions: [
      { id: 1, text: "The children remembered the episode. The episode remembered them.", answer: "candle cove", points: 100 },
      { id: 2, text: "I am a skeleton puppet wearing a top hat who speaks in a high-pitched voice and grinds your bones. Who am I?", answer: "skintaker", points: 100 },
      { id: 3, text: "The main pirate ship in the show has a wooden talking face that constantly giggles. What is the ship's name?", answer: "laughingstock", points: 100},
      { id: 4, text: "The Skin-Taker doesn't talk normal. How does his wooden skeleton jaw slide to speak?", answer: "side to side", points: 100 },
      { id: 5, text: "A mother recalls that when the show came on, her daughter sat and watched static for how many minutes?", answer: "30", points: 100},
      { id: 6, text: "What does the Skin-Taker whisper that he will do to the children's skin once they enter his cove?", answer: "grind it", points: 100 },
    ],
  },
];

export const MAX_LEVEL = 5;
export const QUESTIONS_PER_LEVEL = 6;

export interface PublicQuestion {
  id: number;
  text: string;
  hint?: string;
  image?: string;
  audio?: string;
  file?: string;
  points: number;
  questionNumber: number;
  levelId: number;
}

export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase();
}

function getLevel(levelId: number): LevelData | undefined {
  return creepypastaLevels.find((l) => l.id === levelId);
}

function getQuestionRecord(levelId: number, questionNumber: number): Question | undefined {
  const level = getLevel(levelId);
  if (!level || questionNumber < 1 || questionNumber > QUESTIONS_PER_LEVEL) return undefined;
  return level.questions[questionNumber - 1];
}

/** Returns the current question with no answer field. */
export function getPublicQuestion(
  levelId: number,
  questionNumber: number
): PublicQuestion | null {
  const q = getQuestionRecord(levelId, questionNumber);
  if (!q) return null;

  return {
    id: q.id,
    text: q.text ?? "",
    hint: q.hint,
    image: q.image,
    audio: q.audio,
    file: q.file,
    points: q.points,
    questionNumber,
    levelId,
  };
}

/** Server-side answer validation. */
export function isAnswerCorrect(levelId: number, questionNumber: number, submitted: string): boolean {
  const q = getQuestionRecord(levelId, questionNumber);
  if (!q) return false;
  return normalizeAnswer(submitted) === normalizeAnswer(q.answer);
}

export function getQuestionPoints(levelId: number, questionNumber: number): number {
  return getQuestionRecord(levelId, questionNumber)?.points ?? 0;
}
