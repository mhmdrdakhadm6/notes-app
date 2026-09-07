import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

interface AIChatContextValue {
  pendingMessage: string;
  sendToAI: (message: string) => void;
  consumePendingMessage: () => string;
  aiActiveAt: (active: boolean) => void;
  isAIActive: boolean;
}

const AIChatContext = createContext<AIChatContextValue | undefined>(undefined);

export function AIChatProvider({ children }: PropsWithChildren) {
  const [pendingMessage, setPendingMessage] = useState("");
  const [isAIActive, setIsAIActive] = useState(false);
  const pendingRef = useRef("");

  const sendToAI = useCallback((message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    pendingRef.current = trimmed;
    setPendingMessage(trimmed);
  }, []);

  const consumePendingMessage = useCallback(() => {
    const message = pendingRef.current;
    pendingRef.current = "";
    setPendingMessage("");
    return message;
  }, []);

  const aiActiveAt = useCallback((active: boolean) => {
    setIsAIActive(active);
  }, []);

  return (
    <AIChatContext.Provider
      value={{
        pendingMessage,
        sendToAI,
        consumePendingMessage,
        aiActiveAt,
        isAIActive,
      }}
    >
      {children}
    </AIChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAIChat() {
  const context = useContext(AIChatContext);
  if (context === undefined) {
    throw new Error("useAIChat must be used within an AIChatProvider");
  }
  return context;
}
