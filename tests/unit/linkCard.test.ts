import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@lib/admin-editor/toast", () => ({
  hideLoading: vi.fn(),
  showError: vi.fn(),
  showLoading: vi.fn(),
  showSuccess: vi.fn(),
}));

import {
  clearLinkCardCache,
  convertBasicMarkdown,
  createLinkCardRenderer,
  escapeHtml,
} from "@lib/admin-editor/linkCard";

beforeEach(() => {
  clearLinkCardCache();
});

describe("escapeHtml", () => {
  it("XSS ペイロードの特殊文字を全てエスケープする", () => {
    expect(escapeHtml(`<script>alert("x&y")</script>'`)).toBe(
      "&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;&#39;",
    );
  });

  it("& を最初にエスケープし二重エスケープしない", () => {
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });
});

describe("convertBasicMarkdown", () => {
  it("見出し・強調・リンクを変換する", () => {
    const html = convertBasicMarkdown("# Title\n\n**bold** and *em*");
    expect(html).toContain("<h1>Title</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>em</em>");
  });

  it("リンクは rel=noopener noreferrer 付き target=_blank で出力する", () => {
    const html = convertBasicMarkdown("[site](https://example.com)");
    expect(html).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">site</a>',
    );
  });

  it("javascript: 等の危険な URL はリンク化せずテキストのみ出力する", () => {
    const js = convertBasicMarkdown("[x](javascript:alert(1))");
    expect(js).not.toContain("<a ");
    expect(js).not.toContain("javascript:");
    expect(js).toContain("x");
    const data = convertBasicMarkdown("[y](data:text/html,<script>)");
    expect(data).not.toContain('href="data:');
    const rel = convertBasicMarkdown("[z](//evil.example)");
    expect(rel).not.toContain('href="//');
    expect(rel).toContain("z");
    expect(convertBasicMarkdown("[ok](https://safe.example)")).toContain(
      'href="https://safe.example"',
    );
  });

  it("リストとコードブロックを変換する", () => {
    const html = convertBasicMarkdown("- one\n- two");
    expect(html).toContain("<ul><li>one</li><br><li>two</li></ul>");
    const code = convertBasicMarkdown("```js\nconst a = 1;\n```");
    expect(code).toContain('<pre><code class="language-js">');
  });
});

describe("createLinkCardRenderer / [linkcard:url]", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          url: "https://example.com/page",
          title: "Example",
          description: "desc",
          siteName: "Example Site",
        }),
      })),
    );
  });

  it("未キャッシュの [linkcard:url] はローディングカードに置換し fetch を発火する", () => {
    const { markdownToHtml } = createLinkCardRenderer("/api/link", () => null);
    const html = markdownToHtml("[linkcard:https://example.com/page]");
    expect(html).toContain("link-card-preview loading");
    expect(html).not.toContain("[linkcard:");
    expect(fetch).toHaveBeenCalledWith("/api/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://example.com/page" }),
    });
  });

  it("キャッシュ済み URL はカード HTML として描画され XSS がエスケープされる", async () => {
    const xssTitle = `<img src=x onerror=alert(1)>`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          url: "https://example.com/xss",
          title: xssTitle,
        }),
      })),
    );
    const { markdownToHtml } = createLinkCardRenderer("/api/link", () => null);
    markdownToHtml("[linkcard:https://example.com/xss]");
    await vi.waitFor(() => {
      const html = markdownToHtml("[linkcard:https://example.com/xss]");
      expect(html).toContain("link-card-title");
      expect(html).not.toContain("<img src=x");
      expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });
  });
});
