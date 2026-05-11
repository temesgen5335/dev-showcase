import type { Loader } from "astro/loaders";
import { XMLParser } from "fast-xml-parser";

type MediumItem = {
  title: string;
  link: string;
  guid?: string | { "#text": string };
  pubDate: string;
  "content:encoded"?: string;
  description?: string;
  category?: string | string[];
};

const HTML_TAG = /<[^>]+>/g;
const WS = /\s+/g;

function slugFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() ?? "";
    const cleaned = last
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return cleaned || u.pathname.replace(/[^a-z0-9]+/gi, "-");
  } catch {
    return url.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  }
}

function toExcerpt(html: string | undefined, max = 220): string {
  if (!html) return "";
  const text = html.replace(HTML_TAG, " ").replace(WS, " ").trim();
  return text.length > max ? text.slice(0, max - 1).trimEnd() + "…" : text;
}

function normalizeCategories(c: MediumItem["category"]): string[] {
  if (!c) return [];
  return (Array.isArray(c) ? c : [c]).map((s) => String(s).trim()).filter(Boolean);
}

export function mediumLoader(options: { handle: string }): Loader {
  const feedUrl = `https://medium.com/feed/${options.handle.replace(/^@?/, "@")}`;

  return {
    name: "medium-rss",
    load: async ({ store, parseData, logger }) => {
      let xml: string;
      try {
        const res = await fetch(feedUrl, {
          headers: { "user-agent": "temesgen.dev-build" },
        });
        if (!res.ok) {
          logger.warn(`Medium feed ${feedUrl} → HTTP ${res.status}; skipping.`);
          return;
        }
        xml = await res.text();
      } catch (err) {
        logger.warn(
          `Failed to fetch Medium feed (${err instanceof Error ? err.message : err}); skipping.`,
        );
        return;
      }

      const parser = new XMLParser({
        ignoreAttributes: true,
        cdataPropName: false,
        trimValues: true,
      });

      let parsed: { rss?: { channel?: { item?: MediumItem | MediumItem[] } } };
      try {
        parsed = parser.parse(xml);
      } catch (err) {
        logger.warn(
          `Failed to parse Medium RSS XML (${err instanceof Error ? err.message : err}); skipping.`,
        );
        return;
      }

      const rawItems = parsed.rss?.channel?.item;
      const items: MediumItem[] = Array.isArray(rawItems)
        ? rawItems
        : rawItems
          ? [rawItems]
          : [];

      store.clear();

      for (const item of items) {
        if (!item.link || !item.title) continue;
        const id = slugFromUrl(item.link);
        const data = await parseData({
          id,
          data: {
            title: String(item.title),
            link: String(item.link),
            publishDate: item.pubDate,
            excerpt: toExcerpt(item["content:encoded"] ?? item.description),
            categories: normalizeCategories(item.category),
          },
        });
        store.set({ id, data });
      }

      logger.info(`Medium: loaded ${items.length} post(s) from ${feedUrl}.`);
    },
  };
}
