import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
import { mediumLoader } from "@/loaders/medium";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/projects" }),
  // `image()` resolves the frontmatter path against the MDX file and hands back
  // ImageMetadata, so `astro:assets` can emit responsive WebP at build time.
  // Paths are therefore relative — "../../assets/projects/<file>", not "/projects/<file>".
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      tags: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
      githubUrl: z.string().url().optional(),
      liveUrl: z.string().url().optional(),
      cover: image().optional(),
      gallery: z.array(image()).default([]),
      featured: z.boolean().default(false),
      order: z.number().default(100),
      impact: z.array(z.string()).default([]),
    }),
});

const experience = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/experience" }),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    location: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    companyUrl: z.string().url().optional(),
    stack: z.array(z.string()).default([]),
    bullets: z.array(z.string()).default([]),
    order: z.number(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    publishDate: z.coerce.date(),
    excerpt: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const medium = defineCollection({
  loader: mediumLoader({ handle: "@temesgen5335" }),
  schema: z.object({
    title: z.string(),
    link: z.string().url(),
    publishDate: z.coerce.date(),
    excerpt: z.string(),
    categories: z.array(z.string()).default([]),
  }),
});

export const collections = { projects, experience, posts, medium };
