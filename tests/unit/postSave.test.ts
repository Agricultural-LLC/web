import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("firebase/database", () => ({
  get: vi.fn(),
  push: vi.fn(),
  ref: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
}));
vi.mock("@lib/admin-editor/imageUpload", () => ({
  showImagePreview: vi.fn(),
}));
vi.mock("@lib/admin-editor/toast", () => ({
  hideLoading: vi.fn(),
  showError: vi.fn(),
  showInfo: vi.fn(),
  showLoading: vi.fn(),
  showSuccess: vi.fn(),
  showWarning: vi.fn(),
}));

const byIdMock = vi.hoisted(() => vi.fn(() => ({ focus: vi.fn() })));
vi.mock("@lib/admin-editor/types", async (importOriginal) => {
  const actual = await importOriginal<object>();
  return { ...actual, byId: byIdMock };
});

import {
  buildPostData,
  generateSlug,
  validateForm,
  type EditorState,
} from "@lib/admin-editor/postSave";
import { showError } from "@lib/admin-editor/toast";
import type { EditorConfig, PostFormData } from "@lib/admin-editor/types";

const newsConfig = { enableNewsFields: true } as EditorConfig;
const blogConfig = { enableNewsFields: false } as EditorConfig;

const formData = (overrides: Partial<PostFormData> = {}): PostFormData => ({
  title: "テスト記事",
  description: "説明",
  date: "2026-07-06",
  image: "",
  authors: ["admin"],
  categories: ["news"],
  tags: [],
  body: "本文",
  ...overrides,
});

const state: EditorState = { postId: null, mde: null, pendingPostBody: null };

describe("buildPostData", () => {
  it("作成時は views:0 を初期化する（views 初期化漏れバグを反証）", () => {
    const data = buildPostData(newsConfig, formData({ draft: false }), true);
    expect(data.views).toBe(0);
  });

  it("更新時は views を含めない（views リセットバグを反証）", () => {
    const data = buildPostData(newsConfig, formData({ draft: false }), false);
    expect("views" in data).toBe(false);
  });

  it("公開時のみ publishedAt を付与し、draft 時は付与しない", () => {
    const published = buildPostData(
      newsConfig,
      formData({ draft: false }),
      true,
    );
    const draft = buildPostData(newsConfig, formData({ draft: true }), true);
    expect(typeof published.publishedAt).toBe("string");
    expect("publishedAt" in draft).toBe(false);
    expect(draft.draft).toBe(true);
  });

  it("news フィールド無効時は views/publishedAt を付与せず updatedAt のみ追加", () => {
    const data = buildPostData(blogConfig, formData({ draft: false }), true);
    expect("views" in data).toBe(false);
    expect("publishedAt" in data).toBe(false);
    expect(typeof data.updatedAt).toBe("string");
    expect(data.title).toBe("テスト記事");
  });

  it("入力 formData をミューテートしない", () => {
    const input = formData({ draft: false });
    buildPostData(newsConfig, input, true);
    expect("views" in input).toBe(false);
    expect("updatedAt" in input).toBe(false);
  });
});

describe("validateForm", () => {
  beforeEach(() => {
    vi.mocked(showError).mockClear();
  });

  it("必須項目が全て揃っていれば true", () => {
    expect(validateForm(formData(), state)).toBe(true);
    expect(showError).not.toHaveBeenCalled();
  });

  it("タイトル欠落で false を返しエラー表示する", () => {
    expect(validateForm(formData({ title: "" }), state)).toBe(false);
    expect(showError).toHaveBeenCalledWith(
      "入力エラー",
      expect.stringContaining("タイトルは必須です"),
    );
  });

  it("カテゴリー未選択・本文空を検出する", () => {
    expect(validateForm(formData({ categories: [], body: "" }), state)).toBe(
      false,
    );
    const message = vi.mocked(showError).mock.calls[0][1];
    expect(message).toContain("本文は必須です");
    expect(message).toContain("カテゴリーを選択してください");
  });
});

describe("generateSlug (admin-editor)", () => {
  it("小文字化・空白→ハイフン・記号除去・連続ハイフン圧縮を行う", () => {
    expect(generateSlug("Hello  World!")).toBe("hello-world");
    expect(generateSlug("A -- B")).toBe("a-b");
  });
});
