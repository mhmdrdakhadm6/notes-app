import type { Page, Task } from "../types/nexdo";

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

/* ── smart voice intent engine ─────────────────────────────────────── │
 * Instead of exact phrase matching, the engine:
 *   1. detects the ACTION (delete / mark-done) through intent signals
 *   2. strips filler + intent words to extract the task title
 *   3. leaves fuzzy matching to findBestTaskMatch
 */

interface VoiceAction {
  action: "delete" | "complete" | "none";
  spokenTitle: string;
}

/**
 * Words that tuck around / describe the target task without being part of
 * its title. Removed token-by-token so intent words can appear anywhere.
 */
const TITLE_STOP_TOKENS = new Set(
  [
    "از",
    "به",
    "رو",
    "را",
    "که",
    "یک",
    "یه",
    "اون",
    "اونو",
    "این",
    "اینو",
    "فقط",
    "همین",
    "تسک",
    "تسکها",
    "تسک هارو",
    "وظیفه",
    "وظیفش",
    "وظایف",
    "کار",
    "کارش",
    "کارها",
    "همین",
    "لطفا",
    // delete words
    "حذف",
    "حذفش",
    "حذفشون",
    "پاک",
    "پاکش",
    "پاکشون",
    "کنسل",
    "کنسلش",
    "لغو",
    "لغوش",
    "بردار",
    "بردارش",
    "ببر",
    "ببرش",
    "ببرین",
    "بزن",
    "بیرون",
    "ولش",
    "ولشش",
    "بیخیال",
    "بیخیالش",
    "کن",
    "کنم",
    "نمیشه",
    "نمیخوام",
    "نمیخوامش",
    "نمیخواد",
    "نمیخوادش",
    "نمیخواهم",
    "نمیخواهمش",
    "لازم",
    "نیست",
    "نیس",
    "دیگه",
    "دیگر",
    "کمکی",
    // mark-done words
    "انجام",
    "انجامش",
    "دادم",
    "دادمش",
    "کردم",
    "کردمش",
    "کرده",
    "کردن",
    "میکنم",
    "میکنمش",
    "شد",
    "شدش",
    "شده",
    "شده بود",
    "تموم",
    "تمومش",
    "تمام",
    "تمامش",
    "اوکی",
    "اوکیش",
    "تکمیل",
    "میدم",
    "میسپارم",
  ].map(normalizeSpeechText),
);

/** Strong delete signals — decisive on their own. */
const STRONG_DELETE_SIGNALS = normalizePhrases([
  "حذف",
  "حذفش",
  "حذفشون",
  "پاک",
  "پاکش",
  "پاکشون",
  "لغو",
  "لغوش",
  "کنسل",
  "کنسلش",
  "ولش",
  "ولشش",
  "بردار",
  "بردارش",
  "ببر",
  "ببرش",
  "بزن بیرون",
  "بریز بیرون",
  "بیخیال",
  "بیخیالش",
  "لازم نیست",
  "لازم نیس",
  "دیگه لازم نیست",
  "دیگر لازم نیست",
]);

/** Weak delete signals — need an object word or a very short utterance. */
const WEAK_DELETE_SIGNALS = normalizePhrases([
  "نمیخوام",
  "نمیخوامش",
  "نمیخواد",
  "نمیخوادش",
  "نمیخواهم",
  "نمیخواهمش",
  "بریم",
]);

/** Object nouns that make a weak delete signal decisive. */
const OBJECT_NOUNS = new Set(
  ["تسک", "تسکها", "وظیفه", "وظایف", "کار", "کارها"].map(normalizeSpeechText),
);

/** Mark-done signals (multi-word so plain verbs aren't misread). */
const COMPLETE_SIGNALS = normalizePhrases([
  "انجام دادم",
  "انجامش دادم",
  "انجامش کردم",
  "انجام دادمش",
  "انجام شد",
  "انجامش شد",
  "تموم کردم",
  "تمومش کردم",
  "تموم شد",
  "تمومش شد",
  "تمام کردم",
  "تمامش کردم",
  "تمام شد",
  "تمامش شد",
  "تمومشون کردم",
  "تمومشون شد",
  "اوکی شد",
  "اوکیش کردم",
  "تکمیل شد",
  "تکمیل کردم",
  "تحویل دادم",
  "تحویل دادمش",
]);

function tokenize(normalized: string): string[] {
  return normalized.split(" ").filter(Boolean);
}

function hasAny(utterance: string, signals: string[]): boolean {
  for (const signal of signals) {
    if (utterance.includes(signal)) return true;
  }
  return false;
}

function stripStopTokens(normalized: string): string {
  const kept: string[] = [];
  for (const token of tokenize(normalized)) {
    if (!TITLE_STOP_TOKENS.has(token)) kept.push(token);
  }
  return kept.join(" ");
}

/** Find the signal with the longest span covering the utterance action word. */
export function parseTaskActionCommand(transcript: string): VoiceAction {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) return { action: "none", spokenTitle: "" };

  const tokens = tokenize(normalized);

  const hasStrongDelete = hasAny(normalized, STRONG_DELETE_SIGNALS);
  const hasWeakDelete = hasAny(normalized, WEAK_DELETE_SIGNALS);
  const hasObject = tokens.some((t) => OBJECT_NOUNS.has(t));
  const hasComplete = hasAny(normalized, COMPLETE_SIGNALS);

  // Prefer strong delete over complete (e.g. "تموم کن" can't be both).
  const isDelete =
    hasStrongDelete || (hasWeakDelete && (hasObject || tokens.length <= 3));

  if (isDelete) {
    return { action: "delete", spokenTitle: stripStopTokens(normalized) };
  }

  if (hasComplete) {
    return { action: "complete", spokenTitle: stripStopTokens(normalized) };
  }

  return { action: "none", spokenTitle: "" };
}

export interface DeleteCommand {
  isDelete: boolean;
  spokenTitle: string;
}

export function parseDeleteCommand(transcript: string): DeleteCommand {
  const result = parseTaskActionCommand(transcript);
  return {
    isDelete: result.action === "delete",
    spokenTitle: result.spokenTitle,
  };
}

export interface CompleteCommand {
  isComplete: boolean;
  spokenTitle: string;
}

export function parseCompleteCommand(transcript: string): CompleteCommand {
  const result = parseTaskActionCommand(transcript);
  return {
    isComplete: result.action === "complete",
    spokenTitle: result.spokenTitle,
  };
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
  if (spoken.includes(title)) return 0.92;

  const spokenTokens = tokenize(spoken).filter((t) => t.length >= 2);
  const titleTokens = tokenize(title).filter((t) => t.length >= 2);
  if (spokenTokens.length === 0 || titleTokens.length === 0) return 0;

  // all spoken tokens appear inside the title (any position)
  let tokenHits = 0;
  for (const st of spokenTokens) {
    if (titleTokens.some((tt) => tt.includes(st) || st.includes(tt))) {
      tokenHits += 1;
    }
  }
  const containment = tokenHits / spokenTokens.length;

  const wordDice = wordDiceCoefficient(spoken, title);
  const charDice = charBigramDiceCoefficient(spoken, title);
  const blended = Math.max(0.55 * wordDice + 0.45 * charDice, charDice);

  return Math.max(blended, 0.6 * containment + 0.4 * wordDice);
}

export const MATCH_THRESHOLD = 0.5;

export function findBestTaskMatch(
  tasks: Task[],
  spokenTitle: string,
): Task | null {
  if (!spokenTitle.trim()) return null;

  let bestMatch: Task | null = null;
  let bestScore = 0;

  const uniqueTasks = tasks.filter(
    (task, index, array) => array.findIndex((t) => t.id === task.id) === index,
  );

  for (const task of uniqueTasks) {
    const score = titleSimilarity(spokenTitle, task.title);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = task;
    }
  }

  return bestScore >= MATCH_THRESHOLD ? bestMatch : null;
}

/* ── fullscreen intent ──────────────────────────────────────────────── │
 * Understands any phrasing that asks for / against fullscreen view.
 */

const FULLSCREEN_WORDS = normalizePhrases([
  "تمام صفحه",
  "تموم صفحه",
  "تام صفحه",
  "تمام صفحه کردن",
  "حالت تمام صفحه",
  "نمایش تمام صفحه",
  "تمام صفحه کن",
  "فول اسکرین",
  "فولسکرین",
  "فل اسکرین",
  "فول اسکرین بشه",
  "فول اسکرین کن",
  "fullscreen",
  "full screen",
  "حالت نمایش کامل",
  "نمایش کامل",
  "تمام صفحه نمایش",
]);

const FULLSCREEN_EXIT_MODIFIERS = normalizePhrases([
  "خروج",
  "خارج",
  "بستن",
  "ببند",
  "بسته",
  "کنسل",
  "لغو",
  "نشو",
  "نکن",
  "نخواه",
  "حالت عادی",
  "برگرد",
  "برگردان",
  "عادی کن",
  "بیا پایین",
  "بیار پایین",
  "تمام نشو",
]);

export interface FullscreenCommand {
  isFullscreen: boolean;
  request: "enter" | "exit" | "none";
}

export function parseFullscreenCommand(transcript: string): FullscreenCommand {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) return { isFullscreen: false, request: "none" };

  const hasFullscreenWord = FULLSCREEN_WORDS.some((word) =>
    normalized.includes(word),
  );
  if (!hasFullscreenWord) return { isFullscreen: false, request: "none" };

  const wantsExit = FULLSCREEN_EXIT_MODIFIERS.some((modifier) =>
    normalized.includes(modifier),
  );

  return {
    isFullscreen: true,
    request: wantsExit ? "exit" : "enter",
  };
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

/* ── tab navigation intent ──────────────────────────────────────────── │
 * Understands "take me to <page>" in many phrasings and maps it to a Page.
 * Note: «ببر»/«برو» are also STRONG_DELETE_SIGNALS, so callers must route
 * navigation BEFORE task actions.
 */

const NAVIGATE_SIGNALS = normalizePhrases([
  "برو به",
  "برو توی",
  "برو",
  "ببر به",
  "ببر توی",
  "منو ببر به",
  "منو ببر توی",
  "منو ببر",
  "ببرم به",
  "ببرم توی",
  "بریم به",
  "بریم توی",
  "بریم",
  "باز کن",
  "وارد شو",
  "راهنمایی کن به",
  "سوییچ کن به",
  "سوییچ به",
]);

const PAGE_KEYWORDS: Record<Page, string[]> = {
  dashboard: normalizePhrases([
    "داشبورد",
    "خانه",
    "صفحه اصلی",
    "خونه",
    "اولین صفحه",
  ]),
  tasks: normalizePhrases([
    "وظایف",
    "تسکها",
    "تسک ها",
    "تسکهارو",
    "کارهام",
    "وظیفه های من",
  ]),
  calendar: normalizePhrases(["تقویم", "تقویمم", "برنامه هفته", "روزها"]),
  projects: normalizePhrases(["پروژهها", "پروژه ها", "پروژههام", "پروژه های من"]),
  notes: normalizePhrases(["یادداشتها", "یادداشت ها", "یادداشتم", "نوتها", "نوت ها"]),
  analytics: normalizePhrases(["تحلیلها", "تحلیل ها", "آمار", "آنالیز", "گزارش", "راندمان"]),
  settings: normalizePhrases(["تنظیمات", "ستینگ", "تنظیمات برنامه"]),
  help: normalizePhrases(["راهنما", "پشتیبانی", "کمک", "راهنما و پشتیبانی"]),
  profile: normalizePhrases(["پروفایل", "حساب", "حساب کاربری", "حسابم"]),
};

export interface NavigateCommand {
  isNavigate: boolean;
  page: Page | null;
}

export function parseNavigateCommand(transcript: string): NavigateCommand {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) return { isNavigate: false, page: null };

  const hasSignal = NAVIGATE_SIGNALS.some((signal) =>
    normalized.includes(signal),
  );
  if (!hasSignal) return { isNavigate: false, page: null };

  let bestPage: Page | null = null;
  for (const [page, keywords] of Object.entries(PAGE_KEYWORDS) as [
    Page,
    string[],
  ][]) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      bestPage = page;
      break;
    }
  }

  return { isNavigate: bestPage !== null, page: bestPage };
}

/** Map an AI/voice label (English key or Persian keyword) to a Page. */
export function matchPageLabel(label: string): Page | null {
  const normalizedLabel = normalizeSpeechText(label);
  if (!normalizedLabel) return null;

  const directKey = normalizedLabel as Page;
  if (directKey in PAGE_KEYWORDS) return directKey;

  for (const [page, keywords] of Object.entries(PAGE_KEYWORDS) as [
    Page,
    string[],
  ][]) {
    if (keywords.some((keyword) => normalizedLabel.includes(keyword))) {
      return page;
    }
  }
  return null;
}

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