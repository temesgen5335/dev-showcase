// ChatWidget — recreation of ChatWidget.tsx (mock send, no network)
function ChatWidget() {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([
    { role: "assistant", content: "Hi — I'm Temesgen's portfolio assistant. Ask me about his experience, projects, stack, or availability." },
  ]);
  const [input, setInput] = React.useState("");
  const [streaming, setStreaming] = React.useState(false);
  const scrollerRef = React.useRef(null);

  const SUGGESTIONS = [
    "What is Temesgen's most recent role?",
    "Tell me about the Chronos project.",
    "What is his AI/ML stack?",
  ];

  const FAKE_REPLIES = {
    "what is temesgen's most recent role?": "Founding AI Engineer at Chronos in San Francisco — building the AI financial advisor and multi-currency account infrastructure. Started June 2025.",
    "tell me about the chronos project.": "Chronos is an AI-powered personal finance super-app. Temesgen designed the AI financial advisor (NLP + recommendation models), AI-driven investment strategies across crypto/stocks/NFTs, and a multi-currency ledger for seamless transfers and portfolio management.",
    "what is his ai/ml stack?": "Python + PyTorch / TensorFlow / scikit-learn at the model layer; LangChain, LlamaIndex, LangGraph, Hugging Face Transformers for AI tooling; FAISS and Weaviate for vector search; Airflow and Kafka for data pipelines; FastAPI for serving.",
  };

  React.useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  function send(text) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    const next = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);
    const reply = FAKE_REPLIES[trimmed.toLowerCase()] || "I'd ground that in Temesgen's CV — try asking about his Chronos role, his AI/ML stack, or recent projects like SolveIT or the Legal Expert RAG system.";
    let i = 0;
    const tick = setInterval(() => {
      i += 3;
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: reply.slice(0, i) };
        return copy;
      });
      if (i >= reply.length) { clearInterval(tick); setStreaming(false); }
    }, 25);
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(v => !v)} aria-label={open ? "Close chat" : "Ask my portfolio"}
        style={{ position: "fixed", right: "1.25rem", bottom: "1.25rem", zIndex: 50, fontFamily: "var(--font-mono)", fontSize: "0.8rem", padding: "0.65rem 0.95rem", borderRadius: "999px", border: "1px solid var(--color-border)", background: "var(--color-text-strong)", color: "#000", cursor: "pointer" }}>
        {open ? "close" : "ask my portfolio"}
      </button>
      {open && (
        <div style={{ position: "fixed", right: "1.25rem", bottom: "4.5rem", zIndex: 50, width: "min(22rem, calc(100vw - 2.5rem))", height: "min(32rem, calc(100dvh - 6rem))", display: "flex", flexDirection: "column", border: "1px solid var(--color-border)", borderRadius: "0.6rem", background: "var(--color-surface)", overflow: "hidden", boxShadow: "0 18px 50px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--color-border)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--color-text-strong)" }}>
            ask my portfolio
            <span style={{ color: "var(--color-muted)", marginLeft: "0.5rem", fontSize: "0.72rem" }}>grounded on temesgen's CV</span>
          </div>
          <div ref={scrollerRef} style={{ flex: 1, overflowY: "auto", padding: "0.9rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.88rem", lineHeight: 1.45 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", padding: "0.55rem 0.75rem", borderRadius: "0.5rem", background: m.role === "user" ? "var(--color-surface-2)" : "transparent", border: m.role === "user" ? "1px solid var(--color-border)" : "none", color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
              </div>
            ))}
            {messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.25rem" }}>
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", padding: "0.3rem 0.55rem", border: "1px solid var(--color-border)", borderRadius: "0.35rem", background: "transparent", color: "var(--color-muted)", cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(input); }} style={{ display: "flex", gap: "0.5rem", padding: "0.65rem 0.75rem", borderTop: "1px solid var(--color-border)" }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="ask anything about temesgen…"
              style={{ flex: 1, padding: "0.5rem 0.65rem", borderRadius: "0.35rem", border: "1px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text)", fontSize: "0.85rem", outline: "none", fontFamily: "var(--font-sans)" }} />
            <button type="submit" disabled={streaming || !input.trim()}
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", padding: "0 0.9rem", borderRadius: "0.35rem", border: "1px solid var(--color-border)", background: "var(--color-text-strong)", color: "#000", cursor: streaming ? "not-allowed" : "pointer", opacity: streaming || !input.trim() ? 0.6 : 1 }}>
              {streaming ? "…" : "send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

window.ChatWidget = ChatWidget;
