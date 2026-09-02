/**
 * Deterministic replies for conversational glue — greetings, thanks, goodbyes, "what can you do?".
 *
 * ## Why this exists
 *
 * The system prompt bounds the assistant to questions *about Temesgen*, and the observed failure
 * was that "hi" isn't one. A visitor's first word got the full decline sentence:
 *
 *   > I can only answer questions about Temesgen's background, work, and projects — ask me about
 *   > his experience or one of his projects, or email temesgengebreab33@gmail.com.
 *
 * Technically on-policy, and a terrible front door. `buildSystemPrompt()` now covers this case in
 * prose and few-shots, which handles the long tail ("morning! what's he building?"). This module
 * handles the short head, where prose isn't good enough:
 *
 * - **Deterministic.** Prompt-side politeness is sampled; it can regress on a model swap and you
 *   would never know until someone says "hi" in front of a recruiter. An exact-match table cannot.
 * - **Free and instant.** No provider round trip, no tokens, no cold start on the most common
 *   opening message there is.
 * - **Better copy than a model would write.** A greeting is a menu. These replies name what the
 *   visitor can ask, which is the actual job of the first turn.
 *
 * ## Precision over recall, deliberately
 *
 * A false positive here is much worse than a miss: a canned "Anytime!" in place of a real answer
 * is a broken chatbot, whereas an unmatched greeting just falls through to the model, which the
 * prompt now handles correctly. So matching is **whole-message and exact** against the tables
 * below, after normalisation — never substring, never keyword.
 *
 * That is what keeps "hi, what did he do at Safaricom?" out of here: it normalises to seven words
 * that match no entry, so it reaches the model as the real question it is. Anything with a
 * question mark, extra clauses, or an unlisted word does the same.
 *
 * ## Replies carry no facts
 *
 * Every reply names *categories* to ask about, never a role, employer, project, or metric. Copy in
 * this file isn't reachable from `portfolio-info.md`, so a fact hardcoded here would be a fact
 * that silently goes stale — the exact failure mode that has bitten this repo before. Concrete
 * example questions belong in `SUGGESTIONS` in `ChatWidget.tsx`, where they render as clickable
 * chips and there is only one copy of them.
 */

export type SmalltalkKind = "greeting" | "thanks" | "farewell" | "ack" | "capabilities";

/** Also in the system prompt and the decline sentence — keep the three in step. */
const CONTACT_EMAIL = "temesgengebreab33@gmail.com";

/**
 * Lowercase, drop everything that isn't a letter, digit, or space, collapse whitespace.
 *
 * Folding punctuation away is what makes one table entry cover the realistic spellings of a
 * greeting: "Hi!", "hi.", "HI", "hi 👋" and "hi   " all arrive here as `hi`. Dropping the
 * apostrophe too means `whats up` covers "what's up" and "whats up" with one entry.
 *
 * `\p{L}` rather than `a-z` so a non-Latin script normalises to itself instead of to the empty
 * string — an empty result would otherwise match nothing and fall through, which is the safe
 * direction, but it costs nothing to be honest about the input.
 */
function normalise(message: string): string {
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Whole-message forms only. Read these as "the entire message was this and nothing else".
 *
 * Ordering note: the tables are searched in a fixed order and the first hit wins, so an entry
 * listed in two categories resolves to the earlier one. Keep them disjoint instead of relying on
 * that.
 */
const TABLE: Record<SmalltalkKind, readonly string[]> = {
  greeting: [
    "hi",
    "hii",
    "hiii",
    "hey",
    "heyy",
    "heyyy",
    "hello",
    "helo",
    "hiya",
    "howdy",
    "yo",
    "sup",
    "wassup",
    "whats up",
    "whatsup",
    "whats good",
    "hi there",
    "hello there",
    "hey there",
    "hi again",
    "hello again",
    "hey again",
    "good morning",
    "good afternoon",
    "good evening",
    "good day",
    "morning",
    "afternoon",
    "evening",
    "greetings",
    "hello world",
    // Temesgen is based in Addis Ababa and much of his audience is Ethiopian; "selam" is the
    // everyday Amharic hello. The rest are the loanwords that actually show up in a web chat.
    "selam",
    "salam",
    "salaam",
    "hola",
    "bonjour",
    "ciao",
    "namaste",
  ],
  thanks: [
    "thanks",
    "thank you",
    "thankyou",
    "thanks a lot",
    "thanks a ton",
    "thanks so much",
    "thank you so much",
    "thank you very much",
    "many thanks",
    "thanks man",
    "thanks mate",
    "thanks buddy",
    "ty",
    "tysm",
    "thx",
    "tnx",
    "cheers",
    "appreciated",
    "appreciate it",
    "i appreciate it",
    "much appreciated",
  ],
  farewell: [
    "bye",
    "byebye",
    "bye bye",
    "goodbye",
    "good bye",
    "see you",
    "see ya",
    "see you later",
    "cya",
    "later",
    "take care",
    "good night",
    "goodnight",
    "night",
    "adios",
    "peace",
    "peace out",
    "im done",
    "that is all",
    "thats all",
    "thats it",
    "nothing else",
    "no thanks",
    "no thank you",
  ],
  ack: [
    "ok",
    "okay",
    "k",
    "kk",
    "oki",
    "okey",
    "cool",
    "nice",
    "great",
    "good",
    "awesome",
    "amazing",
    "excellent",
    "perfect",
    "sweet",
    "wow",
    "got it",
    "gotcha",
    "understood",
    "noted",
    "i see",
    "makes sense",
    "good to know",
    "fair enough",
    "sure",
    "alright",
    "all right",
    "interesting",
    "impressive",
    "not bad",
    "sounds good",
  ],
  capabilities: [
    "help",
    "help me",
    "what can you do",
    "what can you do for me",
    "what do you do",
    "what can i ask",
    "what can i ask you",
    "what can i ask about",
    "what should i ask",
    "what should i ask you",
    "what can you help with",
    "what can you help me with",
    "what can you tell me",
    "what do you know",
    "who are you",
    "what are you",
    "who is this",
    "what is this",
    "whats this",
    "what is this for",
    "what are you for",
    "what is your purpose",
    "whats your purpose",
    "how does this work",
    "how do you work",
    "how can you help",
    "are you a bot",
    "are you a robot",
    "are you ai",
    "are you an ai",
    "are you human",
    "are you real",
    "are you chatgpt",
  ],
};

/** Fixed search order; first hit wins. */
const KINDS = ["greeting", "thanks", "farewell", "ack", "capabilities"] as const;

const LOOKUP: ReadonlyMap<string, SmalltalkKind> = new Map(
  KINDS.flatMap((kind) => TABLE[kind].map((phrase) => [phrase, kind] as const)),
);

/**
 * The kind of conversational glue this message is, or `null` for everything else — including every
 * real question, which is the whole point.
 *
 * The word cap is belt-and-braces on top of exact matching: no table entry exceeds six words, so
 * anything longer cannot match anyway, and bailing early keeps a pasted essay from being
 * normalised for nothing.
 */
export function classifySmalltalk(message: string): SmalltalkKind | null {
  const text = normalise(message);
  if (!text || text.length > 64) return null;
  if (text.split(" ").length > 6) return null;
  return LOOKUP.get(text) ?? null;
}

/**
 * Copy for each kind.
 *
 * `firstTurn` distinguishes the visitor's opening "hi" — which should introduce the assistant and
 * offer a menu — from a "hi" dropped mid-conversation, where repeating the introduction reads like
 * the thing has forgotten the last five minutes.
 */
export function smalltalkReply(
  kind: SmalltalkKind,
  { firstTurn = true }: { firstTurn?: boolean } = {},
): string {
  switch (kind) {
    case "greeting":
      // Deliberately does NOT re-introduce the assistant. `ChatWidget` renders its own greeting
      // when the panel opens, so a visitor typing "hi" has already been told what this is —
      // answering with a second introduction reads like the thing wasn't listening. Offer the
      // menu instead, and let the suggestion chips (which reappear after a smalltalk turn) carry
      // the concrete examples.
      return firstTurn
        ? "Hi! What would you like to know — his experience, a particular project, his tech stack, or whether he's available for work?"
        : "Sure — what would you like to know about his work?";
    case "thanks":
      return "Anytime. If anything else about Temesgen's work comes to mind, just ask.";
    case "farewell":
      return `Thanks for stopping by. If you'd like to reach Temesgen directly, he's at ${CONTACT_EMAIL}.`;
    case "ack":
      return "Anything else you'd like to know about his experience or projects?";
    case "capabilities":
      return `I'm the assistant on Temesgen Gebreabzgi's portfolio, and I answer from his CV — his roles and experience, what individual projects do, his tech stack, education and certifications, where he's based, and how to get in touch. Ask away; for anything his CV doesn't cover, email ${CONTACT_EMAIL}.`;
  }
}

/**
 * One-shot helper for the API route: the canned reply for this transcript, or `null` to fall
 * through to the model.
 *
 * Only the final message is classified — it's the one being answered. `firstTurn` is derived from
 * the transcript rather than passed in, so the caller can't get the two out of step.
 */
export function smalltalkResponse(
  messages: readonly { role: "user" | "assistant"; content: string }[],
): { kind: SmalltalkKind; text: string } | null {
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return null;
  const kind = classifySmalltalk(last.content);
  if (!kind) return null;
  const userTurns = messages.filter((m) => m.role === "user").length;
  return { kind, text: smalltalkReply(kind, { firstTurn: userTurns <= 1 }) };
}
