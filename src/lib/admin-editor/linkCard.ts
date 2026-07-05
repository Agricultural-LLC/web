import { hideLoading, showError, showLoading, showSuccess } from "./toast";
import { byId, type LinkCardData, type SimpleMDEInstance } from "./types";

const linkCardCache = new Map<string, LinkCardData>();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateLinkCardHtml(data: LinkCardData): string {
  if (data.error) {
    return `<div class="link-card error">
      <div class="link-card-error">
        <span class="error-icon">⚠️</span>
        <div>
          <div class="error-title">リンクカード読み込みエラー</div>
          <div class="error-message">${escapeHtml(data.message || "")}</div>
          <div class="error-url">${escapeHtml(data.url)}</div>
        </div>
      </div>
    </div>`;
  }

  const domain = new URL(data.url).hostname;
  const title = escapeHtml(data.title || domain);
  const description = escapeHtml(data.description || "");
  const siteName = escapeHtml(data.siteName || domain);
  const url = escapeHtml(data.url);

  return `<div class="link-card-preview">
    <a href="${url}" target="_blank" rel="noopener noreferrer" class="link-card-link">
      ${data.image ? `<div class="link-card-image"><img src="${escapeHtml(data.image)}" alt="${title}" loading="lazy" /></div>` : ""}
      <div class="link-card-content">
        <div class="link-card-header">
          ${data.favicon ? `<img src="${escapeHtml(data.favicon)}" class="link-card-favicon" alt="" />` : '<div class="link-card-favicon-placeholder">🔗</div>'}
          <div class="link-card-meta">
            <div class="link-card-title">${title}</div>
            ${description ? `<div class="link-card-description">${description}</div>` : ""}
            <div class="link-card-site">${siteName}</div>
          </div>
        </div>
      </div>
    </a>
  </div>`;
}

function generateLoadingLinkCard(url: string): string {
  const domain = escapeHtml(new URL(url).hostname);
  return `<div class="link-card-preview loading">
    <div class="link-card-loading">
      <div class="loading-spinner-small"></div>
      <div class="loading-content">
        <div class="loading-title">リンク情報を取得中...</div>
        <div class="loading-url">${domain}</div>
      </div>
    </div>
  </div>`;
}

function convertBasicMarkdown(markdown: string): string {
  let html = markdown
    .replace(/^### (.*$)/gm, "<h3>$1</h3>")
    .replace(/^## (.*$)/gm, "<h2>$1</h2>")
    .replace(/^# (.*$)/gm, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\(([^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    )
    .replace(
      /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,
      '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">',
    )
    .replace(
      /```([\w]*)\n?([\s\S]*?)```/g,
      '<pre><code class="language-$1">$2</code></pre>',
    )
    .replace(
      /`([^`]+)`/g,
      '<code style="background: #f3f4f6; padding: 2px 4px; border-radius: 3px; font-size: 0.9em;">$1</code>',
    )
    .replace(/^\d+\.\s+(.*)$/gm, "<li>$1</li>")
    .replace(/^[-*+]\s+(.*)$/gm, "<li>$1</li>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");

  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  html = "<p>" + html + "</p>";
  html = html.replace(/<p><\/p>/g, "");
  html = html.replace(/<p>(<h[1-6]>)/g, "$1");
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, "$1");
  html = html.replace(/<p>(<ul>)/g, "$1");
  html = html.replace(/(<\/ul>)<\/p>/g, "$1");
  html = html.replace(/<p>(<hr>)<\/p>/g, "$1");
  html = html.replace(/<p>(<pre>)/g, "$1");
  html = html.replace(/(<\/pre>)<\/p>/g, "$1");

  return html;
}

export function createLinkCardRenderer(
  endpoint: string,
  getMde: () => SimpleMDEInstance | null,
) {
  function updatePreview(): void {
    const mde = getMde();
    if (mde && mde.isPreviewActive()) {
      const preview = document.querySelector(".editor-preview");
      if (preview) preview.innerHTML = markdownToHtml(mde.value());
    }
  }

  async function fetchLinkCardData(url: string): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (response.ok) {
        linkCardCache.set(url, data);
      } else {
        linkCardCache.set(url, { error: true, url, message: data.error });
      }
    } catch {
      linkCardCache.set(url, {
        error: true,
        url,
        message: "ネットワークエラー",
      });
    }
    updatePreview();
  }

  function processLinkCards(markdown: string): string {
    const linkCardRegex = /\[linkcard:(https?:\/\/[^\]]+)\]/g;
    return markdown.replace(linkCardRegex, (_match, url: string) => {
      const cached = linkCardCache.get(url);
      if (cached) return generateLinkCardHtml(cached);
      fetchLinkCardData(url);
      return generateLoadingLinkCard(url);
    });
  }

  function markdownToHtml(markdown: string): string {
    const cleanedMarkdown = markdown
      .replace(/!\[\]\(http:\/?\/?$/gm, "")
      .replace(/!\[\]\(http:\/?\)?/g, "")
      .replace(/!\[.*?\]\(http:\/?\/?$/gm, "")
      .replace(/!\[.*?\]\(\s*\)/g, "");

    return convertBasicMarkdown(processLinkCards(cleanedMarkdown));
  }

  return { markdownToHtml };
}

async function requestLinkCardInsertion(
  endpoint: string,
  mde: SimpleMDEInstance,
  url: string,
): Promise<void> {
  showLoading("リンク情報を取得中...");
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "リンクプレビューの取得に失敗しました");
    }

    const cursor = mde.codemirror.getCursor();
    mde.codemirror.replaceRange(`\n[linkcard:${data.url}]\n`, cursor);

    hideLoading();
    showSuccess("挿入完了", "リンクカードが追加されました");
  } catch (error) {
    console.error("Link card error:", error);
    hideLoading();
    const message = error instanceof Error ? error.message : String(error);
    showError("取得エラー", `リンク情報の取得に失敗しました: ${message}`);
  }
}

function validateUrlInput(url: string): boolean {
  if (!url || !url.trim()) {
    showError("入力エラー", "URLを入力してください");
    return false;
  }
  const trimmed = url.trim();
  try {
    const candidate =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : "https://" + trimmed;
    new URL(candidate);
    return true;
  } catch {
    showError(
      "入力エラー",
      "正しいURL形式で入力してください（例: https://example.com）",
    );
    return false;
  }
}

export function initLinkCardDialog(
  endpoint: string,
  getMde: () => SimpleMDEInstance | null,
): { showUrlDialog: () => void } {
  const overlay = byId("url-dialog-overlay");
  const input = byId<HTMLInputElement>("url-input");

  const showUrlDialog = () => {
    input.value = "";
    overlay.classList.add("show");
    setTimeout(() => input.focus(), 300);
  };

  const hideUrlDialog = () => overlay.classList.remove("show");

  const submit = async () => {
    const mde = getMde();
    if (!mde || !validateUrlInput(input.value)) return;
    hideUrlDialog();
    await requestLinkCardInsertion(endpoint, mde, input.value.trim());
  };

  byId("url-cancel").addEventListener("click", hideUrlDialog);
  byId("url-insert").addEventListener("click", submit);

  input.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await submit();
    } else if (e.key === "Escape") {
      hideUrlDialog();
    }
  });

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideUrlDialog();
  });

  return { showUrlDialog };
}
