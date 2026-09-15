import { useEffect, useRef, useState } from "react";

interface WakeAlternative {
  transcript?: string | undefined;
}

interface WakeResult {
  readonly isFinal?: boolean;
  readonly length: number;
  readonly [index: number]: WakeAlternative | undefined;
}

interface WakeResultEvent {
  resultIndex?: number;
  results?: ArrayLike<WakeResult>;
}

interface WakeErrorEvent {
  error?: string;
}

interface WakeSpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: WakeResultEvent) => void) | null;
  onerror: ((event: WakeErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type WakeSpeechRecognitionConstructor = new () => WakeSpeechRecognitionLike;

function getWakeSpeechRecognition(): WakeSpeechRecognitionConstructor | null {
  const browserWindow = window as unknown as {
    SpeechRecognition?: WakeSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WakeSpeechRecognitionConstructor;
  };
  return (
    browserWindow.SpeechRecognition ??
    browserWindow.webkitSpeechRecognition ??
    null
  );
}

export function isWakeSupported(): boolean {
  return (
    typeof window !== "undefined" && Boolean(getWakeSpeechRecognition())
  );
}

function normalizeWakeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

const WAKE_PHRASES = [
  "هی مکس",
  "های مکس",
  "هلی مکس",
  "هی ماکس",
  "های ماکس",
  "هلی ماکس",
  "هیلی مکس",
  "هی میکس",
  "های میکس",
  "هلی میکس",
];

const LATIN_WAKE_PATTERN = /(^|[^a-z])(hey|hi|hay)(\s+|)(max)(?=$|[^a-z])/i;

function matchesWakePhrase(normalized: string): boolean {
  if (!normalized) return false;
  if (LATIN_WAKE_PATTERN.test(normalized)) return true;
  const compact = normalized.replace(/ /g, "");
  for (const phrase of WAKE_PHRASES) {
    const normalizedPhrase = normalizeWakeText(phrase);
    if (normalized.includes(normalizedPhrase)) return true;
    if (compact.includes(normalizedPhrase.replace(/ /g, ""))) return true;
  }
  return false;
}

export function testWakePhrase(rawText: string): boolean {
  return matchesWakePhrase(normalizeWakeText(rawText));
}

export interface UseWakeWordOptions {
  enabled?: boolean;
  lang?: string;
  onWake?: () => void;
  onError?: (code: string) => void;
}

export interface UseWakeWordReturn {
  isSupported: boolean;
  isActive: boolean;
}

export function useWakeWord({
  enabled = false,
  lang = "fa-IR",
  onWake,
  onError,
}: UseWakeWordOptions): UseWakeWordReturn {
  const recognitionRef = useRef<WakeSpeechRecognitionLike | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const lastFiredAtRef = useRef(0);
  const firedRef = useRef(false);
  const [isActive, setIsActive] = useState(false);

  const onWakeRef = useRef(onWake);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onWakeRef.current = onWake;
    onErrorRef.current = onError;
  }, [onWake, onError]);

  const isSupported = isWakeSupported();

  useEffect(() => {
    if (!enabled || !isSupported) {
      return undefined;
    }

    const SpeechRecognitionClass = getWakeSpeechRecognition();
    if (!SpeechRecognitionClass) return undefined;

    let stopped = false;

    const clearRestartTimer = () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
    };

    const stopRecognition = () => {
      clearRestartTimer();
      try {
        recognitionRef.current?.abort();
      } catch {
        /* empty */
      }
      firedRef.current = false;
      setIsActive(false);
    };

    const startSession = () => {
      if (stopped || firedRef.current || !enabled) return;

      window.setTimeout(() => {
        if (stopped || firedRef.current || !enabled) return;

        const recognition = new SpeechRecognitionClass();
        recognitionRef.current = recognition;
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          setIsActive(true);
        };

        recognition.onresult = (event) => {
          const results = event.results;
          if (!results || results.length === 0) return;

          let liveText = "";
          for (
            let index = (event.resultIndex ?? 0);
            index < (results.length ?? 0);
            index += 1
          ) {
            const slot = results[index];
            const chunk = slot?.[0]?.transcript?.trim();
            if (chunk) liveText += ` ${chunk}`;
          }

          const normalized = normalizeWakeText(liveText);
          if (!normalized || !matchesWakePhrase(normalized)) return;

          const now = Date.now();
          if (now - lastFiredAtRef.current < 2500) return;
          lastFiredAtRef.current = now;
          firedRef.current = true;
          clearRestartTimer();
          try {
            recognition.stop();
          } catch {
            /* empty */
          }
          setIsActive(false);
          onWakeRef.current?.();
        };

        recognition.onerror = (event) => {
          const code = event.error ?? "";
          if (code === "aborted" || code === "no-speech") return;
          if (code === "not-allowed" || code === "service-not-allowed") {
            onErrorRef.current?.(code);
          }
        };

        recognition.onend = () => {
          setIsActive(false);
          if (stopped || firedRef.current) return;
          restartTimerRef.current = window.setTimeout(() => {
            if (!stopped) startSession();
          }, 500);
        };

        try {
          recognition.start();
        } catch {
          restartTimerRef.current = window.setTimeout(() => {
            if (!stopped) startSession();
          }, 500);
        }
      }, 120);
    };

    startSession();

    return () => {
      stopped = true;
      stopRecognition();
    };
  }, [enabled, lang, isSupported]);

  return { isSupported, isActive };
}