type ToastType = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✗",
  info: "i",
  warning: "!",
};

const CLOSE_ICON_SVG =
  '<svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>';

function buildToastElement(
  type: ToastType,
  title: string,
  message: string,
): HTMLElement {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = document.createElement("div");
  icon.className = "toast-icon";
  icon.textContent = ICONS[type] || "i";

  const content = document.createElement("div");
  content.className = "toast-content";
  const titleEl = document.createElement("div");
  titleEl.className = "toast-title";
  titleEl.textContent = title;
  const messageEl = document.createElement("div");
  messageEl.className = "toast-message";
  messageEl.textContent = message;
  content.append(titleEl, messageEl);

  const closeBtn = document.createElement("button");
  closeBtn.className = "toast-close";
  closeBtn.innerHTML = CLOSE_ICON_SVG;
  closeBtn.addEventListener("click", () => toast.remove());

  toast.append(icon, content, closeBtn);
  return toast;
}

export function showToast(
  type: ToastType,
  title: string,
  message: string,
  duration = 4000,
): HTMLElement {
  const container = document.getElementById("toast-container");
  const toast = buildToastElement(type, title, message);

  container?.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 300);
  }, duration);

  return toast;
}

export const showSuccess = (title: string, message: string) =>
  showToast("success", title, message);
export const showError = (title: string, message: string) =>
  showToast("error", title, message);
export const showInfo = (title: string, message: string) =>
  showToast("info", title, message);
export const showWarning = (title: string, message: string) =>
  showToast("warning", title, message);

export function showLoading(text = "処理中..."): void {
  const loadingText = document.getElementById("loading-text");
  if (loadingText) loadingText.textContent = text;
  document.getElementById("loading-overlay")?.classList.add("show");
}

export function hideLoading(): void {
  document.getElementById("loading-overlay")?.classList.remove("show");
}
