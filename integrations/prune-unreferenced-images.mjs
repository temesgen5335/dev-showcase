/**
 * Astro emits the *original* file for every imported image asset — including the ones
 * content-collection `image()` fields pull in — because an ESM image import has to resolve
 * to a real URL in case something reads `.src` directly.
 *
 * We never do. Every image goes through `<Image />` or `getImage()`, so the HTML only ever
 * references generated WebP derivatives and the 41 source PNG/JPGs (~42MB) land in `_astro/`
 * completely unreferenced. Visitors never download them, but they triple the size of every
 * deploy artifact.
 *
 * So: after the build, delete any raster image in the output whose filename appears in no
 * HTML, CSS, or JS file. Matching on filename (not a parsed URL) is deliberately conservative
 * — a file referenced from anywhere at all, in any syntax, is kept.
 */
import { readdir, readFile, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

/** Files that could reference an asset, and the raster originals we're willing to drop. */
const TEXT_EXT = new Set([".html", ".css", ".js", ".mjs", ".json", ".map", ".xml", ".txt"]);
const IMAGE_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif"]);

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

export default function pruneUnreferencedImages() {
  return {
    name: "prune-unreferenced-images",
    hooks: {
      // Runs against the client output. The Vercel adapter copies this directory to
      // .vercel/output/static in its own astro:build:done hook, so whichever order the
      // two run in, we prune both by resolving the directory at call time.
      "astro:build:done": async ({ dir, logger }) => {
        const roots = [fileURLToPath(dir)];
        const vercelStatic = path.join(process.cwd(), ".vercel", "output", "static");
        try {
          if ((await stat(vercelStatic)).isDirectory()) roots.push(vercelStatic);
        } catch {
          // Adapter hasn't copied yet (or isn't the Vercel adapter) — pruning `dir` is enough.
        }

        for (const root of roots) {
          let files;
          try {
            files = await walk(root);
          } catch {
            continue;
          }

          const images = files.filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()));
          if (images.length === 0) continue;

          // One pass over every text file, collecting the basenames each one mentions.
          const referenced = new Set();
          const names = images.map((f) => path.basename(f));
          for (const f of files) {
            if (!TEXT_EXT.has(path.extname(f).toLowerCase())) continue;
            const text = await readFile(f, "utf8");
            for (const name of names) {
              if (!referenced.has(name) && text.includes(name)) referenced.add(name);
            }
          }

          let freed = 0;
          let count = 0;
          for (const img of images) {
            if (referenced.has(path.basename(img))) continue;
            freed += (await stat(img)).size;
            await unlink(img);
            count++;
          }

          if (count > 0) {
            const mb = (freed / 1024 / 1024).toFixed(1);
            logger.info(
              `Pruned ${count} unreferenced image${count === 1 ? "" : "s"} (${mb}MB) from ${path.relative(process.cwd(), root) || "."}`,
            );
          }
        }
      },
    },
  };
}
