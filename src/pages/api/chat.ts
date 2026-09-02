import type { APIRoute } from "astro";
import { z } from "zod";
import {
  chatStream,
  ProviderUnavailableError,
  PROVIDER_UNAVAILABLE_MESSAGE,
} from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/context";
import { smalltalkResponse } from "@/lib/smalltalk";

export const prerender = false;

const MAX_TOTAL_CHARS = 12_000;
const RATE_LIMIT = { windowMs: 60_000, maxRequests: 12 } as const;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

/**
 * The transcript is supplied by the browser on every request — this endpoint keeps no session —
 * so an "assistant" turn here is only a *claim* about what was said. Structure is validated to
 * remove the easy footholds: a forged assistant turn can't be the opening move or the thing being
 * answered, and the history can't be padded into a wall of context.
 *
 * This narrows the attack surface; it does not close it. A caller can still fabricate a plausible
 * middle of a conversation, which is why `buildSystemPrompt()` also tells the model the history is
 * untrusted and outranked by the system message.
 */
const BodySchema = z
  .object({
    messages: z.array(MessageSchema).min(1).max(20),
  })
  .refine((b) => b.messages[0]?.role === "user", {
    message: "conversation must start with a user message",
    path: ["messages"],
  })
  .refine((b) => b.messages[b.messages.length - 1]?.role === "user", {
    message: "conversation must end with the user message being answered",
    path: ["messages"],
  })
  .refine(
    (b) => !b.messages.some((m, i) => i > 0 && m.role === "assistant" && b.messages[i - 1]?.role === "assistant"),
    { message: "assistant turns must not be consecutive", path: ["messages"] },
  )
  .refine((b) => b.messages.reduce((n, m) => n + m.content.length, 0) <= MAX_TOTAL_CHARS, {
    message: `transcript exceeds ${MAX_TOTAL_CHARS} characters`,
    path: ["messages"],
  });

/**
 * Best-effort per-IP throttle on a public, unauthenticated LLM endpoint — without it the route is
 * an open proxy onto our provider quota.
 *
 * Deliberately in-memory: it costs nothing and stops the trivial loop. It is NOT a real limiter —
 * state is per function instance, so it resets on cold start and doesn't coordinate across
 * concurrent instances. Vercel's WAF rate limiting is the durable answer; see CLAUDE.md.
 */
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  // Bound the map so a spray of spoofed IPs can't grow it without limit.
  if (hits.size > 5_000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_LIMIT.windowMs)) hits.delete(k);
    }
  }
  return recent.length > RATE_LIMIT.maxRequests;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Checked before body parsing so a flood costs as little as possible.
  // clientAddress throws on adapters that can't provide it, so it's only a fallback and guarded —
  // a throw here would 500 every chat request.
  let ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) {
    try {
      ip = clientAddress;
    } catch {
      ip = undefined;
    }
  }
  if (rateLimited(ip || "unknown")) {
    return new Response("You're sending messages a bit quickly — give it a moment and try again.", {
      status: 429,
      headers: { "retry-after": String(RATE_LIMIT.windowMs / 1000) },
    });
  }

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

  // Conversational glue ("hi", "thanks", "what can you do?") is answered from a table before the
  // model is involved. The prompt handles the long tail, but the head is worth deciding
  // deterministically: it's the most common opening message there is, prompt-side politeness is
  // sampled and can regress on a model swap, and a greeting costs no tokens and no cold start.
  // Matching is exact and whole-message, so a real question never lands here — see lib/smalltalk.ts.
  const canned = smalltalkResponse(parsed.data.messages);
  if (canned) {
    return new Response(canned.text, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
        // Same header shape as the model path so the widget and any log reader can treat the two
        // uniformly; `rule` is what distinguishes them.
        "x-llm-provider": "rule",
        "x-llm-model": `smalltalk:${canned.kind}`,
      },
    });
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
