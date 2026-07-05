import { describe, expect, it } from "vitest";
import { formatDate } from "@lib/formatDate";
import { sortByDate, sortByTitle } from "@lib/sortFunctions";
import taxonomyFilter from "@lib/taxonomyFilter";
import { slugify } from "@lib/textConverter";
import type { GenericEntry } from "@/types";

const entry = (data: Record<string, unknown>): GenericEntry =>
  ({ data }) as unknown as GenericEntry;

describe("sortByDate", () => {
  it("新しい順に並べ、date 欠落エントリを末尾に置く（昇順バグを反証）", () => {
    const sorted = sortByDate([
      entry({ title: "old", date: "2024-01-01" }),
      entry({ title: "none" }),
      entry({ title: "new", date: "2026-07-01" }),
    ]);
    expect(sorted.map((e) => (e as any).data.title)).toEqual([
      "new",
      "old",
      "none",
    ]);
  });
});

describe("sortByTitle", () => {
  it("タイトルの辞書順に並べる", () => {
    const sorted = sortByTitle([
      entry({ title: "banana" }),
      entry({ title: "apple" }),
    ]);
    expect(sorted.map((e) => (e as any).data.title)).toEqual([
      "apple",
      "banana",
    ]);
  });
});

describe("taxonomyFilter", () => {
  const posts = [
    { data: { categories: ["Smart Agriculture", "IoT"] } },
    { data: { categories: ["News"] } },
  ];

  it("スラッグ化したキーで絞り込む（生値比較バグを反証）", () => {
    expect(taxonomyFilter(posts, "categories", "smart-agriculture")).toEqual([
      posts[0],
    ]);
    expect(taxonomyFilter(posts, "categories", "news")).toEqual([posts[1]]);
  });

  it("一致しないキーは空配列を返す", () => {
    expect(taxonomyFilter(posts, "categories", "unknown")).toEqual([]);
  });
});

describe("formatDate", () => {
  it("デフォルトで 'MMMM d, yyyy' 形式に整形する", () => {
    expect(formatDate("2026-07-06T00:00:00Z")).toMatch(/^July \d{1,2}, 2026$/);
  });

  it("カスタムフォーマットを適用する", () => {
    expect(formatDate(new Date(2026, 6, 6), "yyyy/MM/dd")).toBe("2026/07/06");
  });
});

describe("slugify", () => {
  it("空白と大文字を正規化する", () => {
    expect(slugify("Smart Agriculture")).toBe("smart-agriculture");
  });
});
