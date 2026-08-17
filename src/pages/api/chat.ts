import type { APIRoute } from "astro";
import { z } from "zod";
import {
  chatStream,
  ProviderUnavailableError,
  PROVIDER_UNAVAILABLE_MESSAGE,
} from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/context";

export const prerender = false;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(20),
});

export const POST: APIRoute = async ({ request }) => {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    // The widget renders the body text straight into a chat bubble, so this has to read like a
    // sentence — it used to echo raw Zod JSON at the visitor. Detail stays in the server log.
    console.warn("[api/chat] rejected body", JSON.stringify(parsed.error.flatten()));
    return new Response("That message couldn't be sent. Please try again.", { status: 400 });
  }

  try {
    const { stream, provider, model } = await chatStream({
      system: buildSystemPrompt(),
      messages: parsed.data.messages,
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        "x-llm-provider": provider,
        "x-llm-model": model,
      },
    });
  } catch (err) {
    if (err instanceof ProviderUnavailableError) {
      return new Response(PROVIDER_UNAVAILABLE_MESSAGE, { status: 503 });
    }
    console.error("[api/chat]", err);
    return new Response(
      "Sorry, the assistant is having trouble right now. Please try again in a moment.",
      { status: 502 },
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      ok: true,
      hint: "POST { messages: [{role, content}] } to chat.",
    }),
    { headers: { "content-type": "application/json" } },
  );
};
