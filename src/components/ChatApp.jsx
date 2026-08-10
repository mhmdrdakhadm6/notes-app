import OpenAI from "openai";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  FileText,
  Image,
  LoaderCircle,
  Mic,
  PenLine,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const apiKey = import.meta.env.VITE_GAPGPT_API_KEY;

const client = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: "https://api.gapgpt.app/v1",
      dangerouslyAllowBrowser: true,
    })
  : null;

const QUICK_ACTIONS = [
  {
    label: "Create an image",
    prompt: "Create an image of ",
    icon: Image,
    color: "text-fuchsia-300",
    background: "bg-fuchsia-400/10",
  },
  {
    label: "Write or edit",
    prompt: "Help me write or edit ",
    icon: PenLine,
    color: "text-amber-300",
    background: "bg-amber-400/10",
  },
  {
    label: "Search the web",
    prompt: "Search the web for ",
    icon: Search,
    color: "text-sky-300",
    background: "bg-sky-400/10",
  },
];

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

export default function ChatApp() {
  const [selectedModel, setSelectedModel] = useState(getInitialModel);
  const [activeProviderId, setActiveProviderId] = useState(
    () => getProviderByModel(getInitialModel()).id,
  );
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedProvider = getProviderByModel(selectedModel);
  const activeProvider =
    MODEL_PROVIDERS.find((provider) => provider.id === activeProviderId) ??
    selectedProvider;

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const chooseAction = (prompt) => {
    setInput(prompt);
    inputRef.current?.focus();
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

  const handleSend = async (event) => {
    event?.preventDefault();

    const text = input.trim();
    if ((!text && !attachment) || isLoading) return;

    if (!client) {
      setError(
        "VITE_GAPGPT_API_KEY is missing. Add it to your .env.local file and restart the app.",
      );
      return;
    }

    const messageText =
      text ||
      (attachment?.kind === "image"
        ? "Please analyze this image."
        : "Please analyze this file.");
    const apiContent = [{ type: "input_text", text: messageText }];

    if (attachment?.kind === "image") {
      apiContent.push({
        type: "input_image",
        image_url: attachment.dataUrl,
        detail: "auto",
      });
    }

    if (attachment?.kind === "file") {
      apiContent.push({
        type: "input_file",
        filename: attachment.name,
        file_data: attachment.dataUrl.split(",")[1] ?? attachment.dataUrl,
      });
    }

    const nextMessages = [
      ...messages,
      {
        role: "user",
        content: messageText,
        apiContent,
        attachment,
      },
    ];
    setMessages(nextMessages);
    setInput("");
    setAttachment(null);
    setIsAttachmentMenuOpen(false);
    setError("");
    setIsLoading(true);
    const requestModel = selectedModel;

    try {
      const response = await client.responses.create({
        model: requestModel,
        input: nextMessages.map(({ role, content, apiContent: savedContent }) => ({
          role,
          content: savedContent ?? content,
        })),
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: getResponseText(response),
          model: requestModel,
        },
      ]);
    } catch (requestError) {
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
      className="relative flex min-h-[620px] flex-col overflow-hidden bg-black text-white sm:min-h-[680px]"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.13),_transparent_65%)]" />

      <div className="relative z-10 flex items-center justify-center border-b border-white/[0.07] bg-black/70 px-4 py-3 backdrop-blur-xl">
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

      <div className="custom-scrollbar relative flex-1 overflow-y-auto px-4 pb-36 pt-6 sm:px-8">
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-[390px] max-w-md flex-col items-center justify-center">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] shadow-[0_12px_38px_rgba(37,99,235,0.2)]">
              <Sparkles className="text-white" size={23} />
            </div>

            <h3 className="mb-7 text-center text-2xl font-semibold tracking-[-0.025em] text-white sm:text-3xl">
              How can I help?
            </h3>

            <div className="flex w-full flex-col items-center gap-2">
              {QUICK_ACTIONS.map(
                ({ label, prompt, icon: Icon, color, background }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => chooseAction(prompt)}
                    className="group flex w-full max-w-[310px] items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${background} ${color}`}
                    >
                      <Icon size={18} strokeWidth={1.9} />
                    </span>
                    <span>{label}</span>
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[88%] whitespace-pre-wrap rounded-3xl px-4 py-3 text-[15px] leading-7 sm:max-w-[78%] ${
                    message.role === "user"
                      ? "rounded-br-md bg-[#262626] text-white"
                      : "rounded-bl-md border border-white/[0.08] bg-[#111] text-zinc-200"
                  }`}
                >
                  {message.role === "assistant" && message.model && (
                    <span className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
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

                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-3xl rounded-bl-md border border-white/[0.08] bg-[#111] px-4 py-3 text-sm text-zinc-400">
                  <LoaderCircle size={16} className="animate-spin" />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={messageEndRef} />
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
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,.csv,.json,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.html,.xml,.js,.jsx,.ts,.tsx,.css,.py"
            className="hidden"
            onChange={(event) => handleAttachmentSelect(event, "file")}
          />

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
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Message AI"
              aria-label="Message AI"
              className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 text-white outline-none placeholder:text-zinc-500"
            />

            <button
              type="button"
              aria-label="Use microphone"
              className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
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
