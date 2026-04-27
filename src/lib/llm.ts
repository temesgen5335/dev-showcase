import { streamText, type ModelMessage } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

type ProviderName = "groq" | "openai" | "gemini" | "anthropic";

const PROVIDERS = [
  {
    name: "groq" as const,
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    name: "openai" as const,
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4o-mini",
  },
  {
    name: "gemini" as const,
    keyEnv: "GEMINI_API_KEY",
    modelEnv: "GEMINI_MODEL",
    defaultModel: "gemini-2.0-flash",
  },
  {
    name: "anthropic" as const,
    keyEnv: "ANTHROPIC_API_KEY",
    modelEnv: "ANTHROPIC_MODEL",
    defaultModel: "claude-sonnet-4-6",
  },
];

function env(key: string): string | undefined {
  const v = process.env[key];
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

export function selectProvider() {
  const override = env("LLM_PROVIDER") as ProviderName | undefined;
  const pool = override
    ? PROVIDERS.filter((p) => p.name === override)
    : PROVIDERS;

  for (const p of pool) {
    const key = env(p.keyEnv);
    if (key) {
      const modelId = env(p.modelEnv) ?? p.defaultModel;
      return { name: p.name, modelId, model: buildModel(p.name, key, modelId) };
    }
  }
  return null;
}

export async function chatStream({
  system,
  messages,
}: {
  system: string;
  messages: ModelMessage[];
}) {
  const picked = selectProvider();
  if (!picked) {
    throw new Error(
      "No LLM provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY.",
    );
  }
  const result = streamText({
    model: picked.model,
    system,
    messages,
    temperature: 0.4,
    maxOutputTokens: 600,
  });
  return { result, provider: picked.name, model: picked.modelId };
}
