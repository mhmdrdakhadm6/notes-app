import OpenAI from "openai";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import {
  ArrowUp,
  Bot,
  Camera,
  Check,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Image,
  KeyRound,
  LoaderCircle,
  Mic,
  NotebookPen,
  PenLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import { useNotes } from "../hooks/useNotes";

const ENV_API_KEY = import.meta.env.VITE_GAPGPT_API_KEY?.trim() ?? "";
const API_KEY_STORAGE = "notes-ai-api-key";

function getInitialApiKey() {
  return (
    window.sessionStorage.getItem(API_KEY_STORAGE) ||
    window.localStorage.getItem(API_KEY_STORAGE) ||
    ENV_API_KEY
  );
}

function getInitialRememberApiKey() {
  return Boolean(window.localStorage.getItem(API_KEY_STORAGE));
}

function createApiClient(apiKey) {
  return new OpenAI({
    apiKey,
    baseURL: "https://api.gapgpt.app/v1",
    dangerouslyAllowBrowser: true,
  });
}

const MODEL_PROVIDERS = [
  {
    id: "deepseek",
    name: "DeepSeek",
    label: "DS",
    color: "from-cyan-400 to-blue-500",
    models: [
      "deepseek-v4-pro",
      "deepseek-r1",
      "deepseek-v4-flash",
      "deepseek-reasoner",
    ],
  },
  {
    id: "qwen",
    name: "Alibaba / Qwen",
    label: "Q",
    color: "from-violet-400 to-purple-600",
    models: ["gapgpt-qwen-3.6", "gapgpt-qwen-3.5"],
  },
  {
    id: "openai",
    name: "OpenAI",
    label: "AI",
    color: "from-emerald-400 to-teal-600",
    models: [
      "gpt-4o",
      "gpt-5.6-sol",
      "gpt-5.5",
      "gpt-4.1",
      "gpt-5.6-luna",
      "gpt-5.6-terra",
      "gpt-5.4",
      "gpt-4o-mini",
      "gpt-5-mini",
      "gpt-5.4-mini",
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    label: "A",
    color: "from-orange-300 to-amber-600",
    models: [
      "claude-fable-5",
      "claude-opus-5",
      "claude-opus-4-7",
      "claude-opus-4-6",
      "claude-sonnet-4-6",
      "claude-3-5-haiku-20241022",
      "claude-sonnet-4-5-20250929",
      "claude-3-7-sonnet-20250219",
      "claude-opus-4-8",
    ],
  },
  {
    id: "google",
    name: "Google",
    label: "G",
    color: "from-blue-400 via-red-400 to-yellow-400",
    models: [
      "gemini-3.1-pro-preview",
      "gemini-3.5-flash",
      "gemini-3-pro-preview",
      "gemini-2.5-flash",
      "gemini-3.5-flash-lite",
    ],
  },
  {
    id: "xai",
    name: "xAI",
    label: "X",
    color: "from-zinc-200 to-zinc-500",
    models: [
      "grok-4.3",
      "grok-4",
      "grok-4.5",
      "grok-3",
      "grok-3-mini",
      "grok-3-mini-fast",
    ],
  },
];

const DEFAULT_MODEL = "deepseek-v4-pro";
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;
const RESPONSE_FORMAT_INSTRUCTIONS = `
پاسخ را به زبان کاربر بده و متن‌های فارسی را راست‌چین‌پسند بنویس.
برای ساختاربندی پاسخ از Markdown استاندارد استفاده کن.
برای فرمول‌های ریاضی فقط از LaTeX استفاده کن: فرمول درون‌خطی بین $...$ و فرمول مستقل بین $$...$$.
فرمول ریاضی را داخل backtick یا code fence قرار نده.
`;

function getProviderByModel(model) {
  return (
    MODEL_PROVIDERS.find((provider) => provider.models.includes(model)) ??
    MODEL_PROVIDERS[0]
  );
}

function getInitialModel() {
  const savedModel = window.localStorage.getItem("notes-ai-model");
  const isAvailable = MODEL_PROVIDERS.some((provider) =>
    provider.models.includes(savedModel),
  );

  return isAvailable ? savedModel : DEFAULT_MODEL;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The selected file could not be read."));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getResponseText(response) {
  if (response.output_text) return response.output_text;

  return (
    response.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === "output_text")
      .map((item) => item.text)
      .join("\n") || "I couldn't generate a text response."
  );
}

function normalizeMathMarkdown(content) {
  return content
    .replace(
      /```(?:latex|math|tex)\s*\n([\s\S]*?)```/gi,
      (_, expression) => `$$\n${expression.trim()}\n$$`,
    )
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, expression) => {
      return `$$\n${expression.trim()}\n$$`;
    })
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, expression) => {
      return `$${expression.trim()}$`;
  });
}

function createTextRevealer(onUpdate, onProgress) {
  let fullText = "";
  let visibleLength = 0;
  let timerId = null;
  let finishResolver = null;

  const finishIfReady = () => {
    if (visibleLength >= fullText.length && finishResolver) {
      const resolve = finishResolver;
      finishResolver = null;
      resolve(fullText);
    }
  };

  const revealNextPart = () => {
    timerId = null;
    const remaining = fullText.length - visibleLength;

    if (remaining <= 0) {
      finishIfReady();
      return;
    }

    const step =
      remaining > 600 ? 12 : remaining > 250 ? 8 : remaining > 80 ? 5 : 3;
    visibleLength = Math.min(fullText.length, visibleLength + step);
    onUpdate(fullText.slice(0, visibleLength));
    onProgress();

    if (visibleLength < fullText.length) {
      timerId = window.setTimeout(revealNextPart, 34);
    } else {
      finishIfReady();
    }
  };

  const schedule = () => {
    if (timerId === null && visibleLength < fullText.length) {
      timerId = window.setTimeout(revealNextPart, 34);
    }
  };

  return {
    append(text) {
      fullText += text;
      schedule();
    },
    finish() {
      if (visibleLength >= fullText.length) {
        return Promise.resolve(fullText);
      }

      schedule();
      return new Promise((resolve) => {
        finishResolver = resolve;
      });
    },
    getText() {
      return fullText;
    },
  };
}

function AssistantMessage({ content }) {
  return (
    <div className="ai-markdown" dir="rtl">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeMathMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatApp() {
  const { setNotes } = useNotes();
  const [apiKey, setApiKey] = useState(getInitialApiKey);
  const [apiKeyDraft, setApiKeyDraft] = useState(getInitialApiKey);
  const [rememberApiKey, setRememberApiKey] = useState(
    getInitialRememberApiKey,
  );
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");
  const [selectedModel, setSelectedModel] = useState(getInitialModel);
  const [activeProviderId, setActiveProviderId] = useState(
    () => getProviderByModel(getInitialModel()).id,
  );
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [editingMessageIndex, setEditingMessageIndex] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [savedMessageIds, setSavedMessageIds] = useState([]);
  const chatScrollRef = useRef(null);
  const shouldFollowStreamRef = useRef(true);
  const scrollFrameRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechBaseInputRef = useRef("");
  const selectedProvider = getProviderByModel(selectedModel);
  const activeProvider =
    MODEL_PROVIDERS.find((provider) => provider.id === activeProviderId) ??
    selectedProvider;

  const messageCount = messages.length;

  useEffect(() => {
    const scrollContainer = chatScrollRef.current;
    if (!scrollContainer || !shouldFollowStreamRef.current) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: "smooth",
      });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [messageCount]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }

      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.abort();
        speechRecognitionRef.current = null;
      }
    },
    [],
  );

  const scheduleStreamScroll = () => {
    if (!shouldFollowStreamRef.current || scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      const scrollContainer = chatScrollRef.current;

      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }

      scrollFrameRef.current = null;
    });
  };

  const handleChatScroll = () => {
    const scrollContainer = chatScrollRef.current;
    if (!scrollContainer) return;

    const distanceFromBottom =
      scrollContainer.scrollHeight -
      scrollContainer.scrollTop -
      scrollContainer.clientHeight;
    shouldFollowStreamRef.current = distanceFromBottom < 120;
  };

  const handleCopyMessage = async (content, messageId) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
      }

      setCopiedMessageId(messageId);
      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === messageId ? null : current,
        );
      }, 1600);
    } catch {
      setError("متن کپی نشد. لطفاً دوباره تلاش کنید.");
    }
  };

  const handleSaveAsNote = (answer, messageId, messageIndex) => {
    const question = messages
      .slice(0, messageIndex)
      .reverse()
      .find((message) => message.role === "user");

    if (!question?.content?.trim() || !answer.trim()) {
      setError("سؤال یا پاسخ برای ذخیره در یادداشت‌ها پیدا نشد.");
      return;
    }

    setNotes((currentNotes) => [
      ...currentNotes,
      {
        id: crypto.randomUUID(),
        title: question.content.trim(),
        description: answer.trim(),
        date: new Date(),
        recurrence: "none",
        isPermanent: true,
      },
    ]);
    setSavedMessageIds((current) =>
      current.includes(messageId) ? current : [...current, messageId],
    );
    setError("");
  };

  const startEditingMessage = (message, index) => {
    if (isLoading) return;

    setEditingMessageIndex(index);
    setInput(message.content);
    setAttachment(message.attachment ?? null);
    setError("");
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const cancelEditingMessage = () => {
    setEditingMessageIndex(null);
    setInput("");
    setAttachment(null);
    inputRef.current?.focus();
  };

  const openApiKeyModal = () => {
    setApiKeyDraft(apiKey);
    setRememberApiKey(Boolean(window.localStorage.getItem(API_KEY_STORAGE)));
    setApiKeyError("");
    setIsApiKeyVisible(false);
    setIsApiKeyModalOpen(true);
  };

  const closeApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
    setApiKeyError("");
    setIsApiKeyVisible(false);
  };

  const saveApiKey = (event) => {
    event.preventDefault();
    const nextApiKey = apiKeyDraft.trim();

    if (!nextApiKey) {
      setApiKeyError("لطفاً API Key خود را وارد کنید.");
      return;
    }

    if (rememberApiKey) {
      window.localStorage.setItem(API_KEY_STORAGE, nextApiKey);
      window.sessionStorage.removeItem(API_KEY_STORAGE);
    } else {
      window.sessionStorage.setItem(API_KEY_STORAGE, nextApiKey);
      window.localStorage.removeItem(API_KEY_STORAGE);
    }

    setApiKey(nextApiKey);
    setError("");
    closeApiKeyModal();
  };

  const removeApiKey = () => {
    window.localStorage.removeItem(API_KEY_STORAGE);
    window.sessionStorage.removeItem(API_KEY_STORAGE);
    setApiKey(ENV_API_KEY);
    setApiKeyDraft(ENV_API_KEY);
    setRememberApiKey(false);
    setApiKeyError("");

    if (ENV_API_KEY) {
      closeApiKeyModal();
    }
  };

  const openModelPicker = () => {
    setActiveProviderId(selectedProvider.id);
    setIsModelPickerOpen(true);
  };

  const chooseModel = (model) => {
    setSelectedModel(model);
    window.localStorage.setItem("notes-ai-model", model);
    setIsModelPickerOpen(false);
  };

  const handleAttachmentSelect = async (event, kind) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (file.size > MAX_ATTACHMENT_SIZE) {
      setError("Please choose a file smaller than 20 MB.");
      return;
    }

    if (kind === "image" && !file.type.startsWith("image/")) {
      setError("Please choose a valid image file.");
      return;
    }

    setError("");
    setIsAttachmentMenuOpen(false);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAttachment({
        kind,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        dataUrl,
      });
      inputRef.current?.focus();
    } catch (fileError) {
      setError(
        fileError instanceof Error
          ? fileError.message
          : "The selected file could not be read.",
      );
    }
  };

  const toggleVoiceRecording = () => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "مرورگر شما تبدیل گفتار به متن را پشتیبانی نمی‌کند. لطفاً از Chrome یا Edge استفاده کنید.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    speechBaseInputRef.current = input.trimEnd();
    recognition.lang = "fa-IR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      const separator = speechBaseInputRef.current && transcript ? " " : "";

      setInput(`${speechBaseInputRef.current}${separator}${transcript}`);
    };

    recognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "aborted") return;

      const errorMessages = {
        "not-allowed":
          "دسترسی میکروفون داده نشد. لطفاً اجازه استفاده از میکروفون را در تنظیمات مرورگر فعال کنید.",
        "audio-capture":
          "میکروفونی پیدا نشد. اتصال و تنظیمات میکروفون دستگاه را بررسی کنید.",
        network:
          "ارتباط سرویس تشخیص گفتار برقرار نشد. اتصال اینترنت را بررسی کنید.",
        "no-speech": "صدایی شنیده نشد؛ دوباره روی میکروفون بزنید و صحبت کنید.",
      };

      setError(
        errorMessages[event.error] ||
          "تبدیل گفتار به متن متوقف شد. لطفاً دوباره تلاش کنید.",
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
      window.requestAnimationFrame(() => inputRef.current?.focus());
    };

    speechRecognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      speechRecognitionRef.current = null;
      setIsListening(false);
      setError("میکروفون شروع نشد. لطفاً دوباره تلاش کنید.");
    }
  };

  const handleSend = async (event) => {
    event?.preventDefault();

    const text = input.trim();
    const isEditing = editingMessageIndex !== null;
    const messageAttachment = attachment;
    const conversationBeforeMessage = isEditing
      ? messages.slice(0, editingMessageIndex)
      : messages;

    if ((!text && !messageAttachment) || isLoading) return;

    if (isListening) {
      speechRecognitionRef.current?.stop();
    }

    if (!apiKey.trim()) {
      setError("برای شروع گفتگو، ابتدا API Key خود را وارد کنید.");
      openApiKeyModal();
      return;
    }

    const messageText =
      text ||
      (messageAttachment?.kind === "image"
        ? "Please analyze this image."
        : "Please analyze this file.");
    const apiContent = [{ type: "input_text", text: messageText }];

    if (messageAttachment?.kind === "image") {
      apiContent.push({
        type: "input_image",
        image_url: messageAttachment.dataUrl,
        detail: "auto",
      });
    }

    if (messageAttachment?.kind === "file") {
      apiContent.push({
        type: "input_file",
        filename: messageAttachment.name,
        file_data:
          messageAttachment.dataUrl.split(",")[1] ?? messageAttachment.dataUrl,
      });
    }

    const nextMessages = [
      ...conversationBeforeMessage,
      {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role: "user",
        content: messageText,
        apiContent,
        attachment: messageAttachment,
      },
    ];
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
    setEditingMessageIndex(null);
    setIsAttachmentMenuOpen(false);
    setError("");
    setIsLoading(true);
    const requestModel = selectedModel;
    const assistantMessageId = `assistant-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    shouldFollowStreamRef.current = true;

    setMessages((current) => [
      ...current,
      {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        model: requestModel,
        isStreaming: true,
      },
    ]);

    const textRevealer = createTextRevealer(
      (content) => {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content }
              : message,
          ),
        );
      },
      scheduleStreamScroll,
    );

    try {
      const client = createApiClient(apiKey.trim());
      const stream = await client.responses.create({
        model: requestModel,
        instructions: RESPONSE_FORMAT_INSTRUCTIONS,
        input: nextMessages.map(({ role, content, apiContent: savedContent }) => ({
          role,
          content: savedContent ?? content,
        })),
        stream: true,
      });

      for await (const event of stream) {
        if (event.type === "response.output_text.delta" && event.delta) {
          textRevealer.append(event.delta);
        }

        if (event.type === "response.completed" && !textRevealer.getText()) {
          textRevealer.append(getResponseText(event.response));
        }

        if (event.type === "response.failed") {
          throw new Error(
            event.response?.error?.message ||
              "The response could not be completed.",
          );
        }

        if (event.type === "error") {
          throw new Error(
            event.message || "The response stream was interrupted.",
          );
        }
      }

      await textRevealer.finish();

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? { ...message, isStreaming: false }
            : message,
        ),
      );
    } catch (requestError) {
      const receivedText = textRevealer.getText();

      if (receivedText) {
        await textRevealer.finish();
      }

      setMessages((current) =>
        receivedText
          ? current.map((message) =>
              message.id === assistantMessageId
                ? { ...message, isStreaming: false }
                : message,
            )
          : current.filter((message) => message.id !== assistantMessageId),
      );
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      dir="ltr"
      className="relative flex h-[620px] flex-col overflow-hidden bg-black text-white sm:h-[680px]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.13),_transparent_65%)]" />

      <div className="relative z-10 flex items-center justify-center border-b border-white/[0.07] bg-black/70 px-4 py-3 backdrop-blur-xl">
        <button
          type="button"
          onClick={openApiKeyModal}
          disabled={isLoading}
          className={`absolute right-3 flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition sm:right-4 ${
            apiKey
              ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300 hover:bg-emerald-400/[0.13]"
              : "border-amber-400/25 bg-amber-400/[0.08] text-amber-200 hover:bg-amber-400/[0.14]"
          } disabled:cursor-not-allowed disabled:opacity-60`}
          aria-label={apiKey ? "مدیریت API Key" : "افزودن API Key"}
          title={apiKey ? "مدیریت API Key" : "افزودن API Key"}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              apiKey
                ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                : "bg-amber-300"
            }`}
          />
          <KeyRound size={16} />
          <span className="hidden sm:inline">
            {apiKey ? "API متصل" : "افزودن API"}
          </span>
        </button>

        <button
          type="button"
          onClick={openModelPicker}
          disabled={isLoading}
          className="group flex max-w-full items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] py-2 pl-2 pr-3 text-left transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Choose AI model"
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${selectedProvider.color} text-[10px] font-black text-black shadow-lg`}
          >
            {selectedProvider.label}
          </span>
          <span className="min-w-0">
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
              {selectedProvider.name}
            </span>
            <span className="block truncate text-sm font-medium text-zinc-100">
              {selectedModel}
            </span>
          </span>
          <ChevronDown
            size={16}
            className="ml-1 shrink-0 text-zinc-500 transition group-hover:text-zinc-200"
          />
        </button>
      </div>

      {isApiKeyModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-end justify-center bg-black/80 p-0 backdrop-blur-md sm:items-center sm:p-5">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={closeApiKeyModal}
            aria-label="بستن پنجره API Key"
          />

          <section
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="api-key-title"
            className="relative w-full overflow-hidden rounded-t-[30px] border border-white/10 bg-[#111214] shadow-[0_28px_90px_rgba(0,0,0,0.75)] sm:max-w-lg sm:rounded-[30px]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_68%)]" />

            <div className="relative border-b border-white/[0.07] px-5 pb-5 pt-6 sm:px-7">
              <button
                type="button"
                onClick={closeApiKeyModal}
                className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-white/[0.07] hover:text-white"
                aria-label="بستن"
              >
                <X size={18} />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-[0_12px_32px_rgba(16,185,129,0.12)]">
                <KeyRound size={23} />
              </div>
              <h3
                id="api-key-title"
                className="text-xl font-bold tracking-tight text-white"
              >
                اتصال API شخصی
              </h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-zinc-400">
                کلید GapGPT خودت را وارد کن تا درخواست‌ها مستقیماً با حساب
                خودت ارسال شوند.
              </p>
            </div>

            <form onSubmit={saveApiKey} className="relative space-y-4 p-5 sm:p-7">
              <div>
                <label
                  htmlFor="user-api-key"
                  className="mb-2 block text-xs font-semibold text-zinc-300"
                >
                  API Key
                </label>
                <div
                  dir="ltr"
                  className={`flex items-center rounded-2xl border bg-black/35 px-3 transition focus-within:ring-4 ${
                    apiKeyError
                      ? "border-red-400/50 focus-within:border-red-400/70 focus-within:ring-red-400/10"
                      : "border-white/10 focus-within:border-emerald-400/45 focus-within:ring-emerald-400/10"
                  }`}
                >
                  <KeyRound size={17} className="shrink-0 text-zinc-500" />
                  <input
                    id="user-api-key"
                    type={isApiKeyVisible ? "text" : "password"}
                    value={apiKeyDraft}
                    onChange={(event) => {
                      setApiKeyDraft(event.target.value);
                      setApiKeyError("");
                    }}
                    autoComplete="off"
                    autoFocus
                    spellCheck={false}
                    placeholder="sk-••••••••••••••••"
                    className="min-w-0 flex-1 bg-transparent px-3 py-3.5 font-mono text-sm text-white outline-none placeholder:text-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={() => setIsApiKeyVisible((current) => !current)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200"
                    aria-label={
                      isApiKeyVisible ? "مخفی کردن کلید" : "نمایش کلید"
                    }
                  >
                    {isApiKeyVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {apiKeyError && (
                  <p className="mt-2 text-xs text-red-400">{apiKeyError}</p>
                )}
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={rememberApiKey}
                  onChange={(event) => setRememberApiKey(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-emerald-500"
                />
                <span>
                  <span className="block text-sm font-medium text-zinc-200">
                    ذخیره روی این دستگاه
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500">
                    اگر خاموش باشد، کلید فقط تا پایان همین نشست مرورگر نگه‌داری
                    می‌شود.
                  </span>
                </span>
              </label>

              <div className="flex items-start gap-2.5 rounded-2xl bg-blue-500/[0.07] p-3.5 text-xs leading-5 text-blue-200/75">
                <ShieldCheck size={17} className="mt-0.5 shrink-0 text-blue-300" />
                <p>
                  کلید داخل پیام‌ها یا یادداشت‌ها قرار نمی‌گیرد. در دستگاه‌های
                  عمومی گزینه ذخیره را فعال نکن.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-400 active:scale-[0.99]"
                >
                  <Check size={18} />
                  ذخیره و اتصال
                </button>

                {(apiKey || apiKeyDraft) && (
                  <button
                    type="button"
                    onClick={removeApiKey}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-400/15 bg-red-400/[0.06] text-red-300 transition hover:border-red-400/25 hover:bg-red-400/[0.11]"
                    aria-label="حذف API Key"
                    title="حذف API Key"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </form>
          </section>
        </div>
      )}

      {isModelPickerOpen && (
        <div
          className="absolute inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          onMouseDown={() => setIsModelPickerOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Choose an AI model"
            onMouseDown={(event) => event.stopPropagation()}
            className="flex max-h-[85%] w-full flex-col overflow-hidden rounded-t-[28px] border border-white/10 bg-[#111214] shadow-[0_30px_90px_rgba(0,0,0,0.8)] sm:max-h-[620px] sm:max-w-3xl sm:rounded-[28px]"
          >
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Choose a model
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Select a company, then choose its AI model
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModelPickerOpen(false)}
                aria-label="Close model picker"
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 sm:grid-cols-[220px_minmax(0,1fr)]">
              <div className="custom-scrollbar flex gap-2 overflow-x-auto border-b border-white/[0.08] p-3 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r sm:p-4">
                {MODEL_PROVIDERS.map((provider) => {
                  const isActive = provider.id === activeProvider.id;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setActiveProviderId(provider.id)}
                      className={`flex shrink-0 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition sm:w-full ${
                        isActive
                          ? "border-white/15 bg-white/10 text-white"
                          : "border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${provider.color} text-[11px] font-black text-black`}
                      >
                        {provider.label}
                      </span>
                      <span className="whitespace-nowrap">
                        <span className="block text-sm font-medium">
                          {provider.name}
                        </span>
                        <span className="block text-[11px] text-zinc-500">
                          {provider.models.length} models
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="custom-scrollbar min-h-0 overflow-y-auto p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${activeProvider.color} text-xs font-black text-black`}
                  >
                    {activeProvider.label}
                  </span>
                  <div>
                    <h4 className="font-semibold text-white">
                      {activeProvider.name}
                    </h4>
                    <p className="text-xs text-zinc-500">
                      Choose one of the available models
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {activeProvider.models.map((model) => {
                    const isSelected = model === selectedModel;

                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => chooseModel(model)}
                        className={`flex min-w-0 items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                          isSelected
                            ? "border-blue-400/40 bg-blue-500/10 text-white"
                            : "border-white/[0.07] bg-white/[0.025] text-zinc-300 hover:border-white/15 hover:bg-white/[0.06]"
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isSelected
                              ? "bg-blue-500 text-white"
                              : "bg-white/[0.06] text-zinc-500"
                          }`}
                        >
                          {isSelected ? <Check size={18} /> : <Bot size={18} />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {model}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      <div
        ref={chatScrollRef}
        onScroll={handleChatScroll}
        className="custom-scrollbar relative flex-1 overflow-y-auto px-4 pb-36 pt-6 sm:px-8"
      >
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-[390px] max-w-md flex-col items-center justify-center">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_12px_38px_rgba(37,99,235,0.2)]">
              <Sparkles className="text-white" size={23} />
            </div>

            <h3 className="mb-7 text-center text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
              How can I help?
            </h3>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {messages.map((message, index) => (
              <div
                key={message.id ?? `${message.role}-${index}`}
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  dir={message.role === "assistant" ? "rtl" : "auto"}
                  className={`max-w-[88%] rounded-3xl px-4 py-3 text-[15px] leading-7 sm:max-w-[78%] ${
                    message.role === "user"
                      ? "whitespace-pre-wrap rounded-br-md bg-[#262626] text-white"
                      : "ai-response-enter w-full rounded-bl-md border border-white/[0.08] bg-[#111] text-right text-zinc-200"
                  }`}
                >
                  {message.role === "assistant" && message.model && (
                    <span
                      dir="ltr"
                      className="mb-2 flex items-center justify-end gap-1.5 text-[11px] font-medium text-zinc-500"
                    >
                      <Bot size={12} />
                      {message.model}
                    </span>
                  )}

                  {message.attachment?.kind === "image" && (
                    <img
                      src={message.attachment.dataUrl}
                      alt={message.attachment.name}
                      className="mb-3 max-h-72 w-full rounded-2xl object-cover"
                    />
                  )}

                  {message.attachment?.kind === "file" && (
                    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                        <FileText size={20} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-white">
                          {message.attachment.name}
                        </span>
                        <span className="block text-xs text-zinc-400">
                          {formatFileSize(message.attachment.size)}
                        </span>
                      </span>
                    </div>
                  )}

                  {message.role === "assistant" && !message.content ? (
                    <span className="flex items-center justify-end gap-2 text-sm text-zinc-400">
                      <LoaderCircle size={15} className="animate-spin" />
                      در حال فکر کردن...
                    </span>
                  ) : message.role === "assistant" ? (
                    <AssistantMessage content={message.content} />
                  ) : (
                    message.content
                  )}

                  {message.role === "assistant" &&
                    message.isStreaming &&
                    message.content && (
                      <span className="ai-stream-cursor" aria-hidden="true" />
                    )}
                </div>

                {!message.isStreaming && message.content && (
                  <div
                    className={`mt-1.5 flex items-center gap-1 px-2 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyMessage(
                          message.content,
                          message.id ?? `${message.role}-${index}`,
                        )
                      }
                      aria-label={
                        message.role === "user"
                          ? "کپی کردن سؤال"
                          : "کپی کردن پاسخ"
                      }
                      title={
                        message.role === "user"
                          ? "کپی کردن سؤال"
                          : "کپی کردن پاسخ"
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200"
                    >
                      {copiedMessageId ===
                      (message.id ?? `${message.role}-${index}`) ? (
                        <Check size={15} className="text-emerald-400" />
                      ) : (
                        <Copy size={15} />
                      )}
                    </button>

                    {message.role === "user" && (
                      <button
                        type="button"
                        onClick={() => startEditingMessage(message, index)}
                        disabled={isLoading}
                        aria-label="ویرایش سؤال"
                        title="ویرایش سؤال"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <PenLine size={15} />
                      </button>
                    )}

                    {message.role === "assistant" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleSaveAsNote(
                            message.content,
                            message.id ?? `${message.role}-${index}`,
                            index,
                          )
                        }
                        disabled={savedMessageIds.includes(
                          message.id ?? `${message.role}-${index}`,
                        )}
                        aria-label={
                          savedMessageIds.includes(
                            message.id ?? `${message.role}-${index}`,
                          )
                            ? "پاسخ در یادداشت‌ها ذخیره شد"
                            : "ذخیره سؤال و پاسخ در یادداشت‌ها"
                        }
                        title={
                          savedMessageIds.includes(
                            message.id ?? `${message.role}-${index}`,
                          )
                            ? "در یادداشت‌ها ذخیره شد"
                            : "ذخیره در یادداشت‌ها"
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.07] hover:text-zinc-200 disabled:cursor-default disabled:text-emerald-400"
                      >
                        {savedMessageIds.includes(
                          message.id ?? `${message.role}-${index}`,
                        ) ? (
                          <Check size={15} />
                        ) : (
                          <NotebookPen size={15} />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

          </div>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black to-transparent px-3 pb-4 pt-12 sm:px-8 sm:pb-6">
        <form
          onSubmit={handleSend}
          className="relative mx-auto flex w-full max-w-3xl flex-col rounded-[28px] border border-white/[0.12] bg-[#181818] p-2 shadow-[0_18px_55px_rgba(0,0,0,0.65)] transition focus-within:border-white/25"
        >
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleAttachmentSelect(event, "image")}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(event) => handleAttachmentSelect(event, "image")}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.html,.xml,.js,.jsx,.ts,.tsx,.css,.py"
            className="hidden"
            onChange={(event) => handleAttachmentSelect(event, "file")}
          />

          {editingMessageIndex !== null && (
            <div
              dir="rtl"
              className="mx-1 mb-1 flex items-center justify-between rounded-2xl border border-blue-400/20 bg-blue-500/[0.08] px-3 py-2 text-sm text-blue-100"
            >
              <span className="flex items-center gap-2">
                <PenLine size={15} className="text-blue-300" />
                در حال ویرایش سؤال
              </span>
              <button
                type="button"
                onClick={cancelEditingMessage}
                aria-label="لغو ویرایش"
                title="لغو ویرایش"
                className="flex h-7 w-7 items-center justify-center rounded-full text-blue-200 transition hover:bg-white/10 hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {attachment && (
            <div className="mx-1 mb-1 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2 pr-3">
              {attachment.kind === "image" ? (
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
                  <FileText size={23} />
                </span>
              )}

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">
                  {attachment.name}
                </span>
                <span className="block text-xs text-zinc-400">
                  {attachment.kind === "image" ? "Image" : "File"} ·{" "}
                  {formatFileSize(attachment.size)}
                </span>
              </span>

              <button
                type="button"
                onClick={() => setAttachment(null)}
                aria-label="Remove attachment"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 pl-1">
            <div className="relative">
              {isAttachmentMenuOpen && (
                <div className="absolute bottom-12 left-0 z-20 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#202020] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/10"
                  >
                    <Image size={18} className="text-fuchsia-300" />
                    Upload image
                  </button>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/10"
                  >
                    <Camera size={18} className="text-emerald-300" />
                    Take photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/10"
                  >
                    <FileText size={18} className="text-blue-300" />
                    Upload file
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAttachmentMenuOpen((current) => !current)}
                aria-label="Add an image or file"
                aria-expanded={isAttachmentMenuOpen}
                className={`mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition ${
                  isAttachmentMenuOpen
                    ? "rotate-45 bg-white/10 text-white"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Plus size={21} strokeWidth={1.8} />
              </button>
            </div>

            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                const isDesktopInput =
                  window.matchMedia("(hover: hover) and (pointer: fine)")
                    .matches;

                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  isDesktopInput
                ) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              enterKeyHint="enter"
              placeholder={isListening ? "در حال گوش دادن..." : "Message AI"}
              aria-label="Message AI"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-white outline-none placeholder:text-zinc-500"
            />

            <button
              type="button"
              onClick={toggleVoiceRecording}
              disabled={isLoading}
              aria-label={
                isListening ? "توقف تبدیل گفتار به متن" : "شروع تبدیل گفتار به متن"
              }
              aria-pressed={isListening}
              title={
                isListening ? "توقف ضبط صدا" : "تبدیل گفتار به متن"
              }
              className={`relative mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
                isListening
                  ? "bg-red-500/15 text-red-300 shadow-[0_0_0_1px_rgba(248,113,113,0.22)]"
                  : "text-zinc-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isListening && (
                <span className="absolute inset-0 animate-ping rounded-full border border-red-400/35" />
              )}
              <Mic size={20} strokeWidth={1.8} />
            </button>

            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || isLoading}
              aria-label="Send message"
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#093cc8] text-white  transition hover:bg-[#3b7cff] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none"
            >
              {isLoading ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : (
                <ArrowUp size={20} strokeWidth={2.4} />
              )}
            </button>
          </div>
        </form>

        {error && (
          <p
            role="alert"
            className="mx-auto mt-2 max-w-3xl px-4 text-center text-xs text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
