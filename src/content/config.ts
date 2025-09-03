import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

// May also need to update /src/types/index.d.ts when updating this file
// When updating the set of searchable collections, update collectionList in /src/pages/search.astro

const searchable = z.object({
  title: z.string(),
  description: z.string().optional(),
  autodescription: z.boolean().default(true),
  draft: z.boolean().default(false),
});

const about = defineCollection({
  loader: glob({ pattern: "-index.{md,mdx}", base: "./src/content/about" }),
  schema: ({ image }) =>
    searchable.extend({
      image: image().optional(),
      imageAlt: z.string().default(""),
    }),
});

const authors = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/authors" }),
  schema: ({ image }) =>
    searchable.extend({
      image: image().optional(),
      imageAlt: z.string().default(""),
      social: z.object({
        discord: z.string().optional(),
        email: z.string().optional(),
        github: z.string().optional(),
        linkedin: z.string().optional(),
        twitter: z.string().optional(),
      }).optional(),
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.{md,mdx}", base: "./src/content/blog" }),
  schema: ({ image }) =>
    searchable.extend({
      date: z.date().optional(),
      image: image().optional(),
      imageAlt: z.string().default(""),
      authors: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      complexity: z.number().default(1),
      hideToc: z.boolean().default(false),
    }),
});

const docs = defineCollection({
  loader: glob({ pattern: "**\/[^_]*.{md,mdx}", base: "./src/content/docs" }),
  schema: ({ image }) =>
    searchable.extend({
      image: image().optional(),
      imageAlt: z.string().default(""),
      hideNav: z.boolean().default(false),
      hideToc: z.boolean().default(false),
    }),
});

const home = defineCollection({
  loader: glob({ pattern: "-index.{md,mdx}", base: "./src/content/home" }),
  schema: ({ image }) =>
    z.object({
      image: image().optional(),
      imageAlt: z.string().default(""),
      title: z.string(),
      content: z.string(),
      button: z
        .object({
          label: z.string(),
          link: z.string().optional(),
        })
        .optional(),
    }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/portfolio" }),
  schema: searchable.extend({
    projects: z.array(z.string()).optional(),
  }),
});

const project = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/project" }),
  schema: searchable.extend({
    date: z.date().optional(),
  }),
});

const terms = defineCollection({
  loader: glob({ pattern: "*.{md,mdx}", base: "./src/content/terms" }),
  schema: searchable,
});

// Export collections
export const collections = {
  about,
  authors,
  blog,
  docs,
  home,
  portfolio,
  project,
  terms,
};