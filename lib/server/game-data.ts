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
      { id: 1, text: "683v8EsN", image: "/images/material/download.png", answer: "marble", points: 100 },
      { id: 2, text: "The proxies knew the truth long before the witnesses.", audio: "/images/material/entry08.wav", answer: "tuscaloosa", points: 100 },
      { id: 3, text: "It's not what is visible\n It is what it wanted\n https://youtu.be/MtN1YnoL46Q", answer: "seth", points: 100 },
      { id: 4, file: "/images/material/phonebackup.zip", answer: "believers", points: 100 },
      { id: 5, text: "Every year on 5 November, he posted the same photograph.\n Never explained.\n Never missed a year.\nI don't think it was a coincidence. I think it was a clue.\n He was a fan of cricket. And he hated calling people by their real names.", answer: "brian", points: 100 },
      { id: 6, text: "/879", answer: "knight", points: 100 },
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
      { id: 1, text: "74 97 99 107 32 78 121 108 97 115", answer: "kidney", points: 100 },
      { id: 2, text: "the static has ruined the file\nyou must restore it", file: "/images/material/frame.xyz", answer: "parasite", points: 100 },
      { id: 3, text: "seek the beginnings of every step or the numbers?", image: "/images/material/log.png", answer: "brothers", points: 100 },
      { id: 4, text: "Everything's better in Boston\n 65+55+82+121+78+122+69+99", answer: "perry", points: 100 },
      { id: 5, text: "A for?", answer: "rickastley", points: 100 },
      { id: 6, text: "01101001 01110011 01101110 00100111 01110100 00100000 01110100 01101000 01100101 00100000 01101101 01101111 01101111 01101110 00100000 01101100 01101111 01110110 01100101 01101100 01111001 00111111", answer: "monday", points: 100 },
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
      { id: 1, text: "Do you remember your password?\n Maybe I left something for you there :)", answer: "navya", points: 100 },
      { id: 2, text: ":3", answer: "chipmunks", points: 100 },
      { id: 3, text: "Shark tank but not shark tank", answer: "shikarishambhu", points: 100 },
      { id: 4, text: "I may be in SNU now but heart still goes back to GUdXdcfK \n Remember who was the best mod? :P", answer: "mcflurry", points: 100 },
      { id: 5, text: "The children remembered the episode.\n The episode remembered them.", image: "/images/material/audience.png", answer: "scrooged", points: 100 },
      { id: 6, text: "The song was never meant to heal.\n Play it as it was taught.Not as you remember.\n DOWN LEFT UP\nRIGHT DOWN UP", answer: "dimitrescu", points: 100 },
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
      { id: 1, text: "okay once more\n A for? :P", answer: "acmw", points: 100 },
      { id: 2, text: "You're in a computer game, max!\n D egkf fi apng kvhh dyyo sykcd\n AMGC2JAGFXGQ2BUNPKTJRLUXDDQSHVHEAU======\n(maybe later you might need backrooms?)", answer: "lupino", points: 100 },
      { id: 3, text: "The doctors argued over what it was. The intern cared only about what it wanted.", image: "/images/material/maskscan.png", answer: "lushlife", points: 100 },
      { id: 4, text: "So long nerds ", answer: "tracymcconnell", points: 100 },
      { id: 5, text: "Feel like screaming?\n me too - a/BhRCYr5", answer: "interstellar", points: 100 },
      { id: 6, text: "Okay I promise this time it's obvious :P \n A for?", answer: "apple", points: 100 },
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
      { id: 1, text: "The Laughingstock's last transmission reached the harbour. The sailor used the old maritime code before the signal died.\n The archive coordinates are: aGFyYm91cg==", answer: "feastables", points: 100 },
      { id: 2, text: "BYf0y6JZyU4", answer: "luigi", points: 100 },
      { id: 3, image:"/images/material/wheel.png" , answer: "tiger", points: 100 },
      { id: 4, file: "/images/material/songs.zip", answer: "goodnight", points: 100 },
      { id: 5, file: "/images/material/code.c", answer: "margiejoseph", points: 100 },
      { id: 6, text: "Now that you've reached the last level and the hunt shall end\n I think it is important we answer the question\n A for?", answer: "allthewomen", points: 100 },
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
