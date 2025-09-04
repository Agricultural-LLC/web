import GithubSlugger from "github-slugger";

const slugger = new GithubSlugger();

export function generateSlug(title: string): string {
  slugger.reset();
  return slugger.slug(title);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0]; // YYYY-MM-DD format
}

export function validateBlogPost(post: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!post.title || post.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!post.description || post.description.trim() === "") {
    errors.push("Description is required");
  }

  if (!post.date) {
    errors.push("Date is required");
  }

  if (!post.body || post.body.trim() === "") {
    errors.push("Content body is required");
  }

  if (!Array.isArray(post.authors) || post.authors.length === 0) {
    errors.push("At least one author is required");
  }

  if (!Array.isArray(post.categories) || post.categories.length === 0) {
    errors.push("At least one category is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function convertToMarkdown(post: any): string {
  const frontmatter = `---
title: "${post.title}"
description: "${post.description}"
date: ${formatDate(post.date)}
image: "${post.image}"
authors: [${post.authors.map((author: string) => `"${author}"`).join(", ")}]
categories: [${post.categories.map((cat: string) => `"${cat}"`).join(", ")}]
tags: [${post.tags.map((tag: string) => `"${tag}"`).join(", ")}]
draft: ${post.draft}
---

${post.body}`;

  return frontmatter;
}

export function parseMarkdown(markdownContent: string): any {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdownContent.match(frontmatterRegex);

  if (!match) {
    throw new Error("Invalid markdown format - missing frontmatter");
  }

  const [, frontmatterContent, body] = match;
  const frontmatter: any = {};

  // Parse frontmatter (simplified YAML parsing)
  const lines = frontmatterContent.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // Remove quotes
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Parse arrays
      if (value.startsWith("[") && value.endsWith("]")) {
        const arrayContent = value.slice(1, -1);
        frontmatter[key] = arrayContent
          .split(",")
          .map((item: string) => item.trim().replace(/"/g, ""));
      } else if (value === "true" || value === "false") {
        frontmatter[key] = value === "true";
      } else {
        frontmatter[key] = value;
      }
    }
  }

  return {
    ...frontmatter,
    body: body.trim(),
  };
}
