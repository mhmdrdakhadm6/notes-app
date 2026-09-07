import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechAlternative {
  transcript?: string | undefined;
}

interface SpeechResult {
  readonly isFinal?: boolean;
  readonly length: number;
  readonly [index: number]: SpeechAlternative | undefined;
}

interface SpeechResultEvent {
  resultIndex?: number;
  results?: ArrayLike<SpeechResult>;
}

interface SpeechErrorEvent {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const browserWindow = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return (
    browserWindow.SpeechRecognition ??
    browserWindow.webkitSpeechRecognition ??
    null
  );
}

export interface UseVoiceSearchOptions {
  lang?: string;
  silenceTimeout?: number;
  noSpeechTimeout?: number;
  onResult?: (text: string) => void;
  onTranscript?: (text: string) => void;
  onEnd?: () => void;
  onError?: (code: string) => void;
}

export interface UseVoiceSearchReturn {
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
}

const DEFAULT_SILENCE_TIMEOUT = 3000;
const DEFAULT_NO_SPEECH_TIMEOUT = 8000;

function stripOverlapPrefix(finalText: string, interim: string): string {
  const finalWords = finalText.trim().split(/\s+/).filter(Boolean);
  const interimWords = interim.trim().split(/\s+/).filter(Boolean);

  let overlap = 0;
  while (
    overlap < finalWords.length &&
    overlap < interimWords.length &&
    finalWords[finalWords.length - 1 - overlap] === interimWords[overlap]
  ) {
    overlap += 1;
  }

  return interimWords.slice(overlap).join(" ");
}

export function useVoiceSearch({
  lang = "fa-IR",
  silenceTimeout = DEFAULT_SILENCE_TIMEOUT,
  noSpeechTimeout = DEFAULT_NO_SPEECH_TIMEOUT,
  onResult,
  onTranscript,
  onEnd,
  onError,
}: UseVoiceSearchOptions): UseVoiceSearchReturn {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const committedTextRef = useRef("");
  const lastResultsLengthRef = useRef(0);
  const silenceTimerRef = useRef<number | null>(null);
  const noSpeechTimerRef = useRef<number | null>(null);
  const isListeningRef = useRef(false);
  const [isListening, setIsListening] = useState(false);

  const onResultRef = useRef(onResult);
  const onTranscriptRef = useRef(onTranscript);
  const onEndRef = useRef(onEnd);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onTranscriptRef.current = onTranscript;
    onEndRef.current = onEnd;
    onErrorRef.current = onError;
  }, [onResult, onTranscript, onEnd, onError]);

  const isSupported =
    typeof window !== "undefined" && Boolean(getSpeechRecognition());

  useEffect(() => {
    if (!isSupported) return undefined;

    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return undefined;

    const recognition = new SpeechRecognitionClass();

    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const clearSilenceTimer = () => {
      if (silenceTimerRef.current !== null) {
        window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    };

    const clearNoSpeechTimer = () => {
      if (noSpeechTimerRef.current !== null) {
        window.clearTimeout(noSpeechTimerRef.current);
        noSpeechTimerRef.current = null;
      }
    };

    const clearAllTimers = () => {
      clearSilenceTimer();
      clearNoSpeechTimer();
    };

    const scheduleSilenceStop = (millis: number) => {
      clearSilenceTimer();
      silenceTimerRef.current = window.setTimeout(() => {
        if (!isListeningRef.current) return;
        try {
          recognition.stop();
        } catch {
          /* empty */
        }
      }, millis);
    };

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);

      clearNoSpeechTimer();
      noSpeechTimerRef.current = window.setTimeout(() => {
        if (!isListeningRef.current) return;
        try {
          recognition.stop();
        } catch {
          /* empty */
        }
      }, noSpeechTimeout);
    };

    recognition.onresult = (event) => {
      clearNoSpeechTimer();

      const results = event.results;
      const resultsLength = results?.length ?? 0;

      const isRestart =
        (event.resultIndex ?? 0) === 0 && resultsLength < lastResultsLengthRef.current;

      let baseText = isRestart ? committedTextRef.current : "";
      const finalParts: string[] = [];
      let interim = "";

      for (
        let index = Math.max(0, isRestart ? 0 : event.resultIndex ?? 0);
        index < (results?.length ?? 0);
        index += 1
      ) {
        const slot = results?.[index];
        if (!slot) continue;
        const chunk = slot[0]?.transcript?.trim();
        if (!chunk) continue;

        if (slot.isFinal) {
          finalParts.push(chunk);
        } else if (!interim) {
          interim = chunk;
        }
      }

      const finalText = finalParts.join(" ");
      if (isRestart && baseText) {
        committedTextRef.current = [baseText, finalText].filter(Boolean).join(" ");
      } else if (!isRestart && finalText) {
        committedTextRef.current = [committedTextRef.current, finalText]
          .filter(Boolean)
          .join(" ");
      }
      lastResultsLengthRef.current = resultsLength;

      const interimRest = stripOverlapPrefix(committedTextRef.current, interim);
      const liveText = [committedTextRef.current, interimRest]
        .filter(Boolean)
        .join(" ")
        .trim();

      if (liveText) {
        onTranscriptRef.current?.(liveText);
        onResultRef.current?.(committedTextRef.current);
        scheduleSilenceStop(silenceTimeout);
      }
    };

    recognition.onerror = (event) => {
      const code = event.error ?? "";
      if (code === "aborted") return;
      onErrorRef.current?.(code);
    };

    recognition.onend = () => {
      clearAllTimers();
      isListeningRef.current = false;
      setIsListening(false);
      onEndRef.current?.();
    };

    recognitionRef.current = recognition;

    return () => {
      clearAllTimers();
      try {
        recognition.abort();
      } catch {
        /* empty */
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [lang, isSupported, silenceTimeout, noSpeechTimeout]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;
    committedTextRef.current = "";
    lastResultsLengthRef.current = 0;
    try {
      recognitionRef.current.start();
    } catch {
      /* empty */
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListeningRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      /* empty */
    }
  }, []);

  return { isListening, isSupported, startListening, stopListening };
}