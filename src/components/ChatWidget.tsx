import { useEffect, useRef, useState } from "react";

// `error: true` marks a UI-only failure bubble (⚠️ …). It renders like an assistant turn but
// is never sent to the API or persisted — it isn't part of the conversation, and feeding it
// back would put our own error copy into the model's context.
type Msg = { role: "user" | "assistant"; content: string; error?: true };

/**
 * The messages that count as real conversation: non-empty, non-error.
 *
 * `send()` parks an empty assistant placeholder in state to drive the "…" indicator, and the
 * persist effect runs on every state change — so without this filter that placeholder reaches
 * both localStorage and the request body. The API requires `content` to be 1..4000 chars, so a
 * single stored empty message makes every later request fail validation until storage is
 * cleared. That's a permanent wedge for the visitor, so it's filtered at all three boundaries:
 * load, persist, and send.
 */
function conversational(messages: Msg[]): Msg[] {
  return messages.filter((m) => !m.error && m.content.trim().length > 0);
}

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hi — I'm Temesgen's portfolio assistant. Ask me about his experience, projects, stack, or availability.",
};

const SUGGESTIONS = [
  "What is Temesgen's most recent role?",
  "Tell me about the Chronos project.",
  "What is his AI/ML stack?",
];

// Rolling 24h chat persistence in localStorage. Per-browser, no server-side storage.
const STORAGE_KEY = "temesgen-chat-v1";
const TTL_MS = 24 * 60 * 60 * 1000;

type StoredChat = { messages: Msg[]; expiresAt: number };

function loadStoredChat(): Msg[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredChat>;
    if (!parsed || typeof parsed.expiresAt !== "number" || !Array.isArray(parsed.messages)) {
      return null;
    }
    if (parsed.expiresAt < Date.now() || parsed.messages.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const valid = parsed.messages.every(
      (m): m is Msg =>
        !!m &&
        typeof (m as Msg).content === "string" &&
        ((m as Msg).role === "user" || (m as Msg).role === "assistant"),
    );
    if (!valid) return null;
    // Strip rather than reject: this self-heals storage already holding an empty or error
    // message from a stream that died mid-flight, instead of stranding the visitor with a
    // chat that 400s on every send. Good history survives.
    const clean = conversational(parsed.messages as Msg[]);
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  }
}

function persistChat(messages: Msg[]) {
  if (typeof window === "undefined") return;
  try {
    // Never write the in-flight placeholder or an error bubble — if the tab closes mid-stream
    // that empty message would otherwise be what we reload next visit.
    const clean = conversational(messages);
    if (clean.length <= 1) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const data: StoredChat = { messages: clean, expiresAt: Date.now() + TTL_MS };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded / private mode — silently skip */
  }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadedRef = useRef(false);

  // Hydrate from localStorage after mount. SSR renders the greeting; the stored
  // history (if any, and not expired) appears on the first client effect.
  useEffect(() => {
    const stored = loadStoredChat();
    if (stored) setMessages(stored);
    loadedRef.current = true;
  }, []);

  // Persist on every messages change once the initial load has run.
  // Rolling TTL: each interaction extends the 24h window.
  useEffect(() => {
    if (!loadedRef.current) return;
    persistChat(messages);
  }, [messages]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

  function clearHistory() {
    setMessages([GREETING]);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
    }
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          // Only real turns. The API rejects any message with empty content, so an
          // unsent-placeholder or error bubble left in state would 400 the whole request.
          messages: conversational(next).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Chat failed");
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${errText}`, error: true };
          return copy;
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      // A 200 whose body yields nothing — provider died after the headers went out, or the
      // dev server restarted mid-stream. Without this the placeholder just stays blank.
      if (!acc.trim()) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ The assistant returned an empty response. Please try again.",
            error: true,
          };
          return copy;
        });
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ Couldn't reach the chat service.",
            error: true,
          };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Ask my portfolio"}
        style={{
          position: "fixed",
          right: "1.25rem",
          bottom: "1.25rem",
          zIndex: 50,
          fontFamily: "var(--font-mono)",
          fontSize: "0.8rem",
          padding: "0.65rem 0.95rem",
          borderRadius: "999px",
          border: "1px solid var(--color-border)",
          background: "var(--color-text-strong)",
          color: "#000",
          cursor: "pointer",
        }}
      >
        {open ? "close" : "ask my portfolio"}
      </button>
      {open && (
        <div
          style={{
            position: "fixed",
            right: "1.25rem",
            bottom: "4.5rem",
            zIndex: 50,
            width: "min(22rem, calc(100vw - 2.5rem))",
            height: "min(32rem, calc(100dvh - 6rem))",
            display: "flex",
            flexDirection: "column",
            border: "1px solid var(--color-border)",
            borderRadius: "0.6rem",
            background: "var(--color-surface)",
            overflow: "hidden",
            boxShadow: "0 18px 50px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid var(--color-border)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
              color: "var(--color-text-strong)",
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: "0.5rem",
            }}
          >
            <div>
              ask my portfolio
              <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem", fontSize: "0.72rem" }}>
                grounded on temesgen's CV
              </span>
            </div>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={clearHistory}
                disabled={streaming}
                aria-label="Clear chat history"
                title="Clear chat history (stored locally on your device, expires after 24h)"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  padding: "0.2rem 0.45rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "0.3rem",
                  background: "transparent",
                  color: "var(--color-muted)",
                  cursor: streaming ? "not-allowed" : "pointer",
                  opacity: streaming ? 0.5 : 1,
                }}
              >
                clear
              </button>
            )}
          </div>
          <div
            ref={scrollerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "0.9rem 1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              fontSize: "0.88rem",
              lineHeight: 1.45,
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "88%",
                  padding: "0.55rem 0.75rem",
                  borderRadius: "0.5rem",
                  background: m.role === "user" ? "var(--color-surface-2)" : "transparent",
                  border: m.role === "user" ? "1px solid var(--color-border)" : "none",
                  color: "var(--color-text)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.25rem" }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.72rem",
                      padding: "0.3rem 0.55rem",
                      border: "1px solid var(--color-border)",
                      borderRadius: "0.35rem",
                      background: "transparent",
                      color: "var(--color-muted)",
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "0.65rem 0.75rem",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ask anything about temesgen…"
              style={{
                flex: 1,
                padding: "0.5rem 0.65rem",
                borderRadius: "0.35rem",
                border: "1px solid var(--color-border)",
                background: "var(--color-bg)",
                color: "var(--color-text)",
                fontSize: "0.85rem",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={streaming || !input.trim()}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                padding: "0 0.9rem",
                borderRadius: "0.35rem",
                border: "1px solid var(--color-border)",
                background: "var(--color-text-strong)",
                color: "#000",
                cursor: streaming ? "not-allowed" : "pointer",
                opacity: streaming || !input.trim() ? 0.6 : 1,
              }}
            >
              {streaming ? "…" : "send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
