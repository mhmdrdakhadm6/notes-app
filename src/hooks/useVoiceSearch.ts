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

    // سیستم مرجع: هر «بگویید» یک session مستقل و غیرپیوسته است.
    // در نتیجهٔ نهایی هیچ سشن تکراری وجود ندارد.
    recognition.lang = lang;
    recognition.continuous = false;
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
      if (!results || results.length === 0) return;

      const finalParts: string[] = [];
      let interimPart = "";

      for (let index = 0; index < (results?.length ?? 0); index += 1) {
        const slot = results?.[index];
        if (!slot) continue;
        const chunk = slot[0]?.transcript?.trim();
        if (!chunk) continue;

        if (slot.isFinal) {
          finalParts.push(chunk);
        } else if (!interimPart) {
          interimPart = chunk;
        }
      }

      const finalText = finalParts.join(" ");
      const liveText = [finalText, interimPart].filter(Boolean).join(" ").trim();

      if (liveText) {
        onTranscriptRef.current?.(liveText);
      }
      if (finalText) {
        onResultRef.current?.(finalText);
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