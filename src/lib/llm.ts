import { streamText, type ModelMessage } from "ai";
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

const PROVIDERS = [
  {
    name: "groq" as const,
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    name: "gemini" as const,
    keyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.0-flash",
  },  
  {
    name: "openai" as const,
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
  },
  {
    name: "anthropic" as const,
    keyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-4-6",
  },
];

function env(key: string): string | undefined {
  const fromMeta = (import.meta as { env?: Record<string, string | undefined> })
    .env?.[key];
  const v = fromMeta ?? process.env[key];
  return v && v.trim().length > 0 ? v.trim() : undefined;
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
    const modelId = env(p.modelEnv) ?? p.defaultModel;
    out.push({ name: p.name, modelId, model: buildModel(p.name, key, modelId) });
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
  for (const c of candidates) {
    try {
      const result = streamText({
        model: c.model,
        system,
        messages,
        temperature: 0.4,
        maxOutputTokens: 600,
      });
      const reader = result.textStream.getReader();
      const first = await reader.read();
      const encoder = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            if (!first.done && first.value) {
              controller.enqueue(encoder.encode(first.value));
            }
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(encoder.encode(value));
            }
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
        async cancel() {
          await reader.cancel().catch(() => {});
        },
      });
      return { stream, provider: c.name, model: c.modelId };
    } catch (err) {
      lastError = err;
      console.warn(
        `[llm] provider ${c.name} failed, falling back:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  throw lastError ?? new ProviderUnavailableError();
}
