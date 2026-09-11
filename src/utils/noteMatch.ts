import type { Task } from "../types/nexdo";

const DELETE_PHRASES = [
  "حذف از تسک‌ها",
  "حذف از تسک ها",
  "حذف از تسک‌ها کن",
  "از تسک‌ها حذف",
  "از تسک ها حذف",
  "حذف از تسک",
  "از تسک حذف",
];

const LEADING_FILLERS = [
  "تسکی که",
  "تسکی به نام",
  "تسکی به اسم",
  "تسک به نام",
  "تسک به اسم",
  "تسک با نام",
  "تسک با عنوان",
  "تسکی",
  "تسک",
  "لطفا",
];

const TRAILING_FILLERS = [
  "را حذف کن",
  "رو حذف کن",
  "را حذفش کن",
  "رو حذفش کن",
  "را حذف",
  "رو حذف",
  "حذف کن",
  "حذفش کن",
  "حذف",
];

export function normalizeSpeechText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\u200c/g, "") // نیم‌فاصله
    .replace(/ي/g, "ی") // ي عربی → ی فارسی
    .replace(/ك/g, "ک") // ك عربی → ک فارسی
    .replace(/ھ/g, "ه")
    .replace(/إ|أ|آ/g, "ا")
    .replace(/[\u061b\u060c]/g, " ") // ؛ و ،
    .replace(/[.,،!؟؟?؛]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhrases(phrases: string[]): string[] {
  const unique = new Set<string>();
  for (const phrase of phrases) {
    unique.add(normalizeSpeechText(phrase));
  }
  return [...unique].sort((a, b) => b.length - a.length);
}

const NORMALIZED_DELETE_PHRASES = normalizePhrases(DELETE_PHRASES);

export interface DeleteCommand {
  isDelete: boolean;
  spokenTitle: string;
}

export function parseDeleteCommand(transcript: string): DeleteCommand {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) {
    return { isDelete: false, spokenTitle: "" };
  }

  for (const phrase of NORMALIZED_DELETE_PHRASES) {
    if (normalized.endsWith(phrase)) {
      let spokenTitle = normalized
        .slice(0, normalized.length - phrase.length)
        .trim();

      for (const filler of TRAILING_FILLERS) {
        const normalizedFiller = normalizeSpeechText(filler);
        if (spokenTitle.endsWith(normalizedFiller)) {
          spokenTitle = spokenTitle
            .slice(0, spokenTitle.length - normalizedFiller.length)
            .trim();
        }
      }

      let cleaned = spokenTitle;
      for (const filler of LEADING_FILLERS) {
        const normalizedFiller = normalizeSpeechText(filler);
        if (cleaned === normalizedFiller) {
          cleaned = "";
        } else if (cleaned.startsWith(`${normalizedFiller} `)) {
          cleaned = cleaned.slice(normalizedFiller.length).trim();
        }
      }

      return { isDelete: true, spokenTitle: cleaned };
    }
  }

  return { isDelete: false, spokenTitle: "" };
}

function wordDiceCoefficient(first: string, second: string): number {
  const firstWords = first.split(" ").filter(Boolean);
  const secondWords = second.split(" ").filter(Boolean);
  if (firstWords.length === 0 || secondWords.length === 0) return 0;

  const secondSet = new Set(secondWords);
  let matchCount = 0;
  for (const word of firstWords) {
    if (word.length > 1 && secondSet.has(word)) {
      matchCount += 1;
    }
  }

  return (2 * matchCount) / (firstWords.length + secondWords.length);
}

function charBigramDiceCoefficient(first: string, second: string): number {
  const firstBigrams = new Map<string, number>();
  const secondBigrams = new Map<string, number>();

  for (let index = 0; index < first.length - 1; index += 1) {
    const bigram = first.slice(index, index + 2);
    firstBigrams.set(bigram, (firstBigrams.get(bigram) ?? 0) + 1);
  }
  for (let index = 0; index < second.length - 1; index += 1) {
    const bigram = second.slice(index, index + 2);
    secondBigrams.set(bigram, (secondBigrams.get(bigram) ?? 0) + 1);
  }

  if (firstBigrams.size === 0 || secondBigrams.size === 0) return 0;

  let intersection = 0;
  for (const [bigram, count] of firstBigrams) {
    intersection += Math.min(count, secondBigrams.get(bigram) ?? 0);
  }

  return (2 * intersection) / (firstBigrams.size + secondBigrams.size);
}

function titleSimilarity(spokenTitle: string, noteTitle: string): number {
  const spoken = normalizeSpeechText(spokenTitle);
  const title = normalizeSpeechText(noteTitle);
  if (!spoken || !title) return 0;

  if (title.includes(spoken)) return 1;
  if (spoken.includes(title)) return 0.9;

  const wordDice = wordDiceCoefficient(spoken, title);
  const charDice = charBigramDiceCoefficient(spoken, title);

  return Math.max(wordDice, charDice);
}

export const MATCH_THRESHOLD = 0.55;

export function findBestTaskMatch(
  tasks: Task[],
  spokenTitle: string,
): Task | null {
  if (!spokenTitle.trim()) return null;

  let bestMatch: Task | null = null;
  let bestScore = 0;

  for (const task of tasks) {
    const score = titleSimilarity(spokenTitle, task.title);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = task;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? bestMatch : null;
}

const AI_MESSAGE_PHRASES = normalizePhrases([
  "پیام به ای آی",
  "پیام به هوش مصنوعی",
  "پیام به ai",
  "پیام به ai بده",
  "برای هوش مصنوعی بفرست",
  "به هوش مصنوعی بده",
  "به ai بده",
]);

const AI_LEADING_FILLERS = normalizePhrases([
  "لطفا",
  "لطفا این",
  "این متن",
  "این پیام",
  "پیام",
  "متن",
]);

export interface AIMessageCommand {
  isAIMessage: boolean;
  message: string;
}

export function parseAIMessageCommand(transcript: string): AIMessageCommand {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) {
    return { isAIMessage: false, message: "" };
  }

  for (const phrase of AI_MESSAGE_PHRASES) {
    if (normalized.endsWith(phrase)) {
      let message = normalized
        .slice(0, normalized.length - phrase.length)
        .trim();

      for (const filler of AI_LEADING_FILLERS) {
        const normalizedFiller = normalizeSpeechText(filler);
        if (message === normalizedFiller) {
          message = "";
        } else if (message.startsWith(`${normalizedFiller} `)) {
          message = message.slice(normalizedFiller.length).trim();
        }
      }

      return { isAIMessage: true, message };
    }
  }

  return { isAIMessage: false, message: "" };
}

const SAY_END_PHRASES = [
  "بگو",
  "بگوید",
  "بفرما",
  "بفرمایید",
  "توضیح بده",
  "توضیح بده بگو",
].map(normalizeSpeechText);

const SAY_START_PHRASES = [
  "بهم بگو",
  "به من بگو",
  "به من بفرما",
  "بهم بفرما",
  "لطفا بهم بگو",
  "لطفا به من بگو",
  "بگو",
  "بفرما",
].map(normalizeSpeechText);

export interface SayCommand {
  isSay: boolean;
  message: string;
}

export function parseSayCommand(transcript: string): SayCommand {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) {
    return { isSay: false, message: "" };
  }

  for (const phrase of [...SAY_START_PHRASES].sort(
    (a, b) => b.length - a.length,
  )) {
    if (normalized.startsWith(phrase)) {
      return { isSay: true, message: transcript.trim() };
    }
  }

  for (const phrase of [...SAY_END_PHRASES].sort(
    (a, b) => b.length - a.length,
  )) {
    if (normalized.endsWith(phrase)) {
      return { isSay: true, message: transcript.trim() };
    }
  }

  return { isSay: false, message: "" };
}

const LINE_BREAK_WORDS = ["بعدی", "بعدش"].map(normalizeSpeechText);

export function applyLineBreaks(text: string): string {
  const words = text
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const lines: string[] = [];
  let currentLine: string[] = [];

  for (const word of words) {
    const normalizedWord = normalizeSpeechText(word);

    if (LINE_BREAK_WORDS.includes(normalizedWord)) {
      if (currentLine.length > 0) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }
      continue;
    }

    currentLine.push(word);
  }

  if (currentLine.length > 0) {
    lines.push(currentLine.join(" "));
  }

  return lines.join("\n").trim();
}