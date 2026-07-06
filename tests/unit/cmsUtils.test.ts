import { describe, expect, it } from "vitest";
import {
  convertToMarkdown,
  formatDate,
  generateSlug,
  parseMarkdown,
  validateBlogPost,
} from "@lib/cms/utils";

describe("generateSlug (cms)", () => {
  it("github-slugger 形式のスラッグを生成する", () => {
    expect(generateSlug("Hello World!")).toBe("hello-world");
  });

  it("slugger をリセットするため同一タイトルで同一スラッグを返す（-1 連番バグを反証）", () => {
    expect(generateSlug("Same Title")).toBe("same-title");
    expect(generateSlug("Same Title")).toBe("same-title");
  });
});

describe("formatDate (cms)", () => {
  it("YYYY-MM-DD 形式に正規化する", () => {
    expect(formatDate("2026-07-06T12:34:56Z")).toBe("2026-07-06");
    expect(formatDate(new Date("2025-01-02T00:00:00Z"))).toBe("2025-01-02");
  });
});

describe("validateBlogPost", () => {
  const valid = {
    title: "t",
    description: "d",
    date: "2026-07-06",
    body: "b",
    authors: ["a"],
    categories: ["c"],
  };

  it("必須項目が揃っていれば isValid=true", () => {
    expect(validateBlogPost(valid)).toEqual({ isValid: true, errors: [] });
  });

  it("空白のみのタイトルと空 authors を弾く", () => {
    const result = validateBlogPost({ ...valid, title: "  ", authors: [] });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Title is required");
    expect(result.errors).toContain("At least one author is required");
  });
});

describe("convertToMarkdown / parseMarkdown ラウンドトリップ", () => {
  it("frontmatter と本文が往復で保存される", () => {
    const post = {
      title: "Round Trip",
      description: "desc",
      date: "2026-07-06",
      image: "/img.png",
      authors: ["admin"],
      categories: ["news"],
      tags: ["tag1", "tag2"],
      draft: false,
      body: "Body text",
    };
    const parsed = parseMarkdown(convertToMarkdown(post));
    expect(parsed.title).toBe("Round Trip");
    expect(parsed.tags).toEqual(["tag1", "tag2"]);
    expect(parsed.draft).toBe(false);
    expect(parsed.body).toBe("Body text");
  });

  it("frontmatter が無い markdown は例外を投げる", () => {
    expect(() => parseMarkdown("no frontmatter")).toThrow(
      /missing frontmatter/,
    );
  });
});
