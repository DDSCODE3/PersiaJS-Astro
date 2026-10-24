import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const articles = defineCollection({
  // File name = URL slug (keep it short and in English, e.g. v8-garbage-collection.md)
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/articles" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().max(200),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      author: z.string(),
      authorLinkedIn: z.url().optional(),
      authorBio: z.string().optional(),
      coverImage: image().optional(),
      tags: z.array(z.string()).default([]),
      lang: z.enum(["fa", "en"]).default("en"),
      linkedinUrl: z.url().optional(),
      telegramUrl: z.url().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { articles };
