import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, open]);

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
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "Chat failed");
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: `⚠️ ${errText}` };
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
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "⚠️ Couldn't reach the chat service.",
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
            }}
          >
            ask my portfolio
            <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem", fontSize: "0.72rem" }}>
              grounded on temesgen's CV
            </span>
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
