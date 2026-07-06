import { beforeEach, describe, expect, it, vi } from "vitest";

const { getIdToken, authMock } = vi.hoisted(() => {
  const getIdToken = vi.fn(async () => "test-id-token");
  const authMock: {
    currentUser: { getIdToken: typeof getIdToken } | null;
  } = { currentUser: { getIdToken } };
  return { getIdToken, authMock };
});

vi.mock("@lib/firebase/config", () => ({
  auth: authMock,
  database: {},
}));

import { triggerContentSync } from "@lib/cms/sync";

describe("triggerContentSync", () => {
  beforeEach(() => {
    authMock.currentUser = { getIdToken };
    vi.stubGlobal("fetch", vi.fn());
  });

  it("Bearer トークン付きで /api/cms/sync に POST し成功結果を整形する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "started", timestamp: "2026-07-06" }),
    } as Response);

    const result = await triggerContentSync();

    expect(fetch).toHaveBeenCalledWith("/api/cms/sync", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-id-token",
        "Content-Type": "application/json",
      },
    });
    expect(result).toEqual({
      success: true,
      message: "started",
      timestamp: "2026-07-06",
    });
  });

  it("未認証時は fetch せず失敗結果を返す（認証チェック欠落バグを反証）", async () => {
    authMock.currentUser = null;
    const result = await triggerContentSync();
    expect(fetch).not.toHaveBeenCalled();
    expect(result.success).toBe(false);
    expect(result.error).toBe("User not authenticated");
  });

  it("API エラー時はレスポンスの error を伝播する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "workflow dispatch failed" }),
    } as Response);

    const result = await triggerContentSync();
    expect(result.success).toBe(false);
    expect(result.error).toBe("workflow dispatch failed");
  });
});
