/**
 * SERVER-ONLY. Never import this file from any "use client" component.
 * All answer data lives exclusively here and is never sent to the browser.
 */

interface Question {
  id: number;
  text: string;
  hint: string;
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
      { id: 1, text: "I have no face, yet I watch you in the woods. I stand tall in the shadows. How many pages must you gather to survive my original game?", hint: "It's a single digit number between 5 and 10.", answer: "8", points: 100 },
      { id: 2, text: "My presence is marked by a specific sign. What letter or character is inside the circle painted on the forest trees?", hint: "Think of a cross, or a common algebraic variable.", answer: "x", points: 120 },
      { id: 3, text: "I stretch my dark appendages from my back to grasp and ensnare you. What are these black, elastic limbs called?", hint: "Similar to what an octopus has.", answer: "tentacles", points: 150 },
      { id: 4, text: "A message carved into a tree trunk is encrypted with a Caesar Cipher (shift -3): 'WKH IRUHVW ZDWFKHV'. Decrypt it.", hint: "Subtract 3 positions from each letter (e.g., W becomes T, K becomes H).", answer: "the forest watches", points: 200 },
      { id: 5, text: "Before I appear in front of you, what visual distortion occurs on your electronic cameras or monitors?", hint: "Starts with 'S'. Old analogue television signal noise.", answer: "static", points: 250 },
      { id: 6, text: "Complete the warning message frantically scrawled on the final page: 'ALWAYS WATCHES, NO ______'.", hint: "I have no face. I see all but have no...", answer: "eyes", points: 300 },
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
      { id: 1, text: "I wear a signature blue mask with empty eye sockets. What color is the thick, dark liquid that continuously drips from those hollow pits?", hint: "Deepest dark. The color of midnight or tar.", answer: "black", points: 150 },
      { id: 2, text: "I am a nocturnal harvester. Which bean-shaped organ do I sneak into bedrooms to surgically extract from my victims?", hint: "Humans have two of these in the renal system. Jack loves to eat them.", answer: "kidney", points: 180 },
      { id: 3, text: "With what small, razor-sharp surgical tool do I make my precise incisions?", hint: "Standard doctor's blade.", answer: "scalpel", points: 200 },
      { id: 4, text: "On Jack's blood-stained desk, you find binary code: '01001100 01001001 01010110 01000101 01010010'. Convert it to ASCII text.", hint: "Starts with L, ends with R. Another major organ Jack targets.", answer: "liver", points: 250 },
      { id: 5, text: "My iconic blue mask has no nostrils or eyes. What dark, supple material is this mask crafted from?", hint: "Animal hide processed for garments.", answer: "leather", points: 280 },
      { id: 6, text: "Lore states that Jack was a student who served as a soldier in which historical global war before his tragic transformation?", hint: "Use initials or Roman numerals (e.g., WWI or World War 1).", answer: "wwi", points: 350 },
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
      { id: 1, text: "The cartridge was gold, blank, and bought at a shady garage sale. What N64 Legend of Zelda title was hacked by my spirit?", hint: "Features a falling moon and a 3-day cycle.", answer: "majora's mask", points: 200 },
      { id: 2, text: "I was a young boy who met a watery end. What element took my life and now floods your game files?", hint: "H2O.", answer: "water", points: 220 },
      { id: 3, text: "When the game glitches, an eerie, hollow statue of Link spawns, tracking your movements. What is the name of this creepy statue/song item?", hint: "Elegy of _______.", answer: "emptiness", points: 250 },
      { id: 4, text: "Ben displays a reversed text warning: 'TAHT ENOD EVAH T'NDLUOHS UOY'. What is the corrected sentence?", hint: "Read it from right to left, letter by letter. Include punctuation.", answer: "you shouldn't have done that", points: 300 },
      { id: 5, text: "What is the alias of the creepy old seller who handed over the cursed cartridge to Jadusable?", hint: "Simply 'old man' or 'the old man'.", answer: "old man", points: 320 },
      { id: 6, text: "What beautiful but eerie ocarina melody, when played in reverse, triggers my presence and digital drowning?", hint: "Song of ________.", answer: "healing", points: 400 },
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
      { id: 1, text: "My eyes glow brightly, matching the color of the strings I use to lock onto your limbs. What color is this?", hint: "The color of precious metal 79.", answer: "gold", points: 250 },
      { id: 2, text: "Before ending my own life and becoming The Puppeteer, what was my human name?", hint: "First name is Jonathan, last name is...", answer: "jonathan blake", points: 280 },
      { id: 3, text: "I feed on target emotions until my victims lose hope. What are the strings that slide from my fingers made of?", hint: "They glow. They are made of telekinetic _______.", answer: "strings", points: 320 },
      { id: 4, text: "Solve this anagram from the theater pamphlet: 'REMNATOIET'. (Clue: A puppet operated by strings).", hint: "Starts with M, ends with E.", answer: "marionette", points: 350 },
      { id: 5, text: "What do I slowly drain and consume from my victims to sustain my gray-skinned immortal body?", hint: "Feelings, joy, depression. They are human...", answer: "emotions", points: 380 },
      { id: 6, text: "Complete my chilling ultimate declaration: 'They are all just my ______'.", hint: "Synonym for marionettes.", answer: "puppets", points: 450 },
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
      { id: 1, text: "What is the name of this haunted, fictional pirate puppet show that children watched in the 1970s?", hint: "The title of Level 5.", answer: "candle cove", points: 300 },
      { id: 2, text: "I am a skeleton puppet wearing a top hat who speaks in a high-pitched voice and grinds your bones. Who am I?", hint: "The Skin-______.", answer: "skintaker", points: 350 },
      { id: 3, text: "The main pirate ship in the show has a wooden talking face that constantly giggles. What is the ship's name?", hint: "Starts with 'L'. Relates to laughter.", answer: "laughingstock", points: 380 },
      { id: 4, text: "The Skin-Taker doesn't talk normal. How does his wooden skeleton jaw slide to speak?", hint: "Not up and down, but side to...", answer: "side to side", points: 420 },
      { id: 5, text: "A mother recalls that when the show came on, her daughter sat and watched static for how many minutes?", hint: "Half an hour. Type as a number or words (e.g. '30 minutes' or '30').", answer: "30", points: 480 },
      { id: 6, text: "What does the Skin-Taker whisper that he will do to the children's skin once they enter his cove?", hint: "He wants to 'grind' it. What does he do to it? 'To grind your...' or 'grind it'.", answer: "grind it", points: 600 },
    ],
  },
];

export const MAX_LEVEL = 5;
export const QUESTIONS_PER_LEVEL = 6;

export interface PublicQuestion {
  id: number;
  text: string;
  hint: string;
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
export function getPublicQuestion(levelId: number, questionNumber: number): PublicQuestion | null {
  const q = getQuestionRecord(levelId, questionNumber);
  if (!q) return null;
  return { id: q.id, text: q.text, hint: q.hint, points: q.points, questionNumber, levelId };
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
