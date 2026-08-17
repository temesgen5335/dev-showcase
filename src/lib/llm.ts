import { streamText, type ModelMessage, type TextStreamPart, type ToolSet } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

type ProviderName = "groq" | "openai" | "gemini" | "anthropic";

export const PROVIDER_UNAVAILABLE_MESSAGE =
  "Sorry, this feature is not available currently.";

export class ProviderUnavailableError extends Error {
  constructor(message: string = PROVIDER_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

/**
 * Each provider carries an ordered list of models, tried in order before moving to the next
 * provider — a retired model ID costs one extra round trip instead of dropping the provider.
 *
 * Model IDs rot: Groq retired the entire Llama line and Google retired gemini-2.0-flash out
 * from under the old single-model defaults *simultaneously*, which is what took the chatbot
 * down. One model per provider meant one retirement per provider was a total outage.
 *
 * When a model 404s, ask the key what it can actually reach rather than guessing a successor:
 *   GET api.groq.com/openai/v1/models                    -H "Authorization: Bearer $GROQ_API_KEY"
 *   GET generativelanguage.googleapis.com/v1beta/models  -H "x-goog-api-key: $GEMINI_API_KEY"
 * Availability is per-key, not per-provider — gemini-2.5-flash is listed for this key but
 * returns "no longer available to new users", so being in the catalog is not proof of access.
 */
const MAX_MODELS_PER_PROVIDER = 3;

const PROVIDERS = [
  {
    name: "groq" as const,
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    // gpt-oss-20b/120b verified against this key; qwen is listed but unexercised.
    models: ["openai/gpt-oss-20b", "openai/gpt-oss-120b", "qwen/qwen3.6-27b"],
  },
  {
    name: "gemini" as const,
    keyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    // gemini-3-flash-preview verified end-to-end. Deliberately omits gemini-2.5-flash:
    // this key is refused with "no longer available to new users".
    models: ["gemini-3-flash-preview", "gemini-3.1-flash-lite"],
  },
  {
    name: "openai" as const,
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    // UNVERIFIED — no OPENAI_API_KEY is set, so this provider never loads.
    models: ["gpt-4o-mini"],
  },
  {
    name: "anthropic" as const,
    keyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    // Current IDs, but UNVERIFIED — no ANTHROPIC_API_KEY is set. Sonnet/Haiku tier to match
    // the previously configured claude-sonnet-4-6; claude-opus-5 is the max-quality option.
    models: ["claude-sonnet-5", "claude-haiku-4-5"],
  },
];

function env(key: string): string | undefined {
  const fromMeta = (import.meta as { env?: Record<string, string | undefined> })
    .env?.[key];
  const v = fromMeta ?? process.env[key];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

/**
 * A `*_MODEL` env var may name several models, comma-separated, tried left to right:
 *   GROQ_MODEL=openai/gpt-oss-20b,openai/gpt-oss-120b
 * A single value (the common case) is just a one-element list.
 */
function envList(key: string): string[] {
  return (env(key) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildModel(name: ProviderName, apiKey: string, modelId: string) {
  switch (name) {
    case "groq":
      return createGroq({ apiKey })(modelId);
    case "openai":
      return createOpenAI({ apiKey })(modelId);
    case "gemini":
      return createGoogleGenerativeAI({ apiKey })(modelId);
    case "anthropic":
      return createAnthropic({ apiKey })(modelId);
  }
}

type Candidate = {
  name: ProviderName;
  modelId: string;
  model: ReturnType<typeof buildModel>;
};

function listCandidates(): Candidate[] {
  const override = env("LLM_PROVIDER") as ProviderName | undefined;
  const ordered = override
    ? [
        ...PROVIDERS.filter((p) => p.name === override),
        ...PROVIDERS.filter((p) => p.name !== override),
      ]
    : PROVIDERS;

  const out: Candidate[] = [];
  for (const p of ordered) {
    const key = env(p.keyEnv);
    if (!key) continue;
    // Env-configured models come first and the built-in list follows as backup, so a stale
    // `*_MODEL` value degrades to one wasted round trip instead of taking the provider down.
    // Deduped so naming a built-in in .env doesn't retry the same model twice.
    const modelIds = [...new Set([...envList(p.modelEnv), ...p.models])].slice(
      0,
      MAX_MODELS_PER_PROVIDER,
    );
    for (const modelId of modelIds) {
      out.push({ name: p.name, modelId, model: buildModel(p.name, key, modelId) });
    }
  }
  return out;
}

export function selectProvider() {
  return listCandidates()[0] ?? null;
}

export async function chatStream({
  system,
  messages,
}: {
  system: string;
  messages: ModelMessage[];
}) {
  const candidates = listCandidates();
  if (candidates.length === 0) {
    throw new ProviderUnavailableError();
  }

  let lastError: unknown;
  for (const [i, c] of candidates.entries()) {
    // Held outside the try so the catch can release it on failover.
    let reader: ReadableStreamDefaultReader<TextStreamPart<ToolSet>> | undefined;
    try {
      const result = streamText({
        model: c.model,
        system,
        messages,
        temperature: 0.4,
        maxOutputTokens: 600,
        // This loop is the only retry layer that matters. Left at the default (2 retries with
        // exponential backoff) a dead provider stalls the response ~5-10s before we fail over.
        maxRetries: 0,
      });

      // Read `fullStream`, not `textStream`. A provider failure arrives as an `{ type: "error" }`
      // part; `textStream` swallows it and simply ends, so the previous first-read probe saw a
      // clean end-of-stream, fell through to "success", and returned 200 with an empty body —
      // meaning failover never once engaged and a bad model looked like a silent empty reply.
      const committed = result.fullStream.getReader();
      reader = committed;

      // Only commit to this provider once it has produced real text.
      let firstText: string | undefined;
      while (firstText === undefined) {
        const { done, value } = await committed.read();
        if (done) break;
        if (value.type === "error") throw value.error;
        if (value.type === "text-delta" && value.text) firstText = value.text;
      }
      if (firstText === undefined) {
        throw new Error("stream produced no text");
      }

      const opening = firstText;
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            controller.enqueue(encoder.encode(opening));
            while (true) {
              const { done, value } = await committed.read();
              if (done) break;
              // Too late to fail over — headers are already out — so surface it and let the
              // client show its error bubble rather than truncating silently.
              if (value.type === "error") throw value.error;
              if (value.type === "text-delta" && value.text) {
                controller.enqueue(encoder.encode(value.text));
              }
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
        async cancel() {
          await committed.cancel().catch(() => {});
        },
      });
      return { stream, provider: c.name, model: c.modelId };
    } catch (err) {
      lastError = err;
      await reader?.cancel().catch(() => {});
      // Quota/auth/bad-model vs transient should be one readable line, not a stack dump.
      const e = err as { statusCode?: number; message?: string; cause?: { statusCode?: number } };
      const status = e?.statusCode ?? e?.cause?.statusCode;
      // Name what happens next, so "this model is dead" reads differently from "this provider
      // is dead" — a 404 that stays inside one provider is a much smaller problem.
      const next = candidates[i + 1];
      const nextStep = !next
        ? "no candidates left"
        : next.name === c.name
          ? `trying ${next.name}/${next.modelId}`
          : `switching to ${next.name}/${next.modelId}`;
      console.warn(
        `[llm] ${c.name}/${c.modelId} failed${status ? ` [${status}]` : ""} — ${nextStep}:`,
        e?.message ?? err,
      );
    }
  }
  throw lastError ?? new ProviderUnavailableError();
}
