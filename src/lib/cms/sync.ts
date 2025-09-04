import { auth } from "../firebase/config";

export interface SyncResult {
  success: boolean;
  message: string;
  timestamp?: string;
  error?: string;
}

/**
 * Triggers a content sync from Firebase to GitHub
 * This will cause the GitHub Actions workflow to run and update the static site
 */
export async function triggerContentSync(): Promise<SyncResult> {
  try {
    // Get current user's ID token
    const user = auth.currentUser;
    if (!user) {
      throw new Error("User not authenticated");
    }

    const idToken = await user.getIdToken();

    // Call the sync API endpoint
    const response = await fetch("/api/cms/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${idToken}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || `Sync failed with status ${response.status}`,
      );
    }

    return {
      success: true,
      message: result.message || "Content sync triggered successfully",
      timestamp: result.timestamp,
    };
  } catch (error) {
    console.error("Content sync error:", error);
    return {
      success: false,
      message: "Failed to trigger content sync",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Triggers content sync and shows user feedback
 * This is a convenience function for use in the CMS UI
 */
export async function triggerContentSyncWithFeedback(): Promise<void> {
  // Show loading state
  const loadingToast = showToast("コンテンツ同期中...", "info", 0);

  try {
    const result = await triggerContentSync();

    // Hide loading toast
    hideToast(loadingToast);

    if (result.success) {
      showToast(
        "✅ コンテンツ同期が開始されました。数分後にサイトに反映されます。",
        "success",
        5000,
      );
    } else {
      showToast(`❌ 同期に失敗しました: ${result.error}`, "error", 8000);
    }
  } catch (error) {
    hideToast(loadingToast);
    showToast("❌ 同期処理でエラーが発生しました", "error", 8000);
    console.error("Sync with feedback error:", error);
  }
}

/**
 * Auto-trigger sync after content operations
 * This can be called after saving, updating, or deleting content
 */
export async function autoTriggerSync(
  operation: string,
  contentType: string,
): Promise<void> {
  try {
    const result = await triggerContentSync();

    if (result.success) {
      console.log(`Auto-sync triggered after ${operation} ${contentType}`);

      // Show subtle notification
      showToast(`${operation}完了 - サイト更新中...`, "info", 3000);
    } else {
      console.warn("Auto-sync failed:", result.error);
    }
  } catch (error) {
    console.error("Auto-sync error:", error);
  }
}

// Toast notification functions (simplified implementation)
interface Toast {
  id: string;
  element: HTMLElement;
}

let toastContainer: HTMLElement | null = null;
const activeToasts = new Map<string, Toast>();

function ensureToastContainer(): HTMLElement {
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.className = "fixed top-4 right-4 z-50 space-y-2";
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

function showToast(
  message: string,
  type: "success" | "error" | "info" = "info",
  duration: number = 3000,
): string {
  const container = ensureToastContainer();
  const toastId = Date.now().toString();

  const toast = document.createElement("div");
  toast.className = `
    max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
    transform transition-all duration-300 ease-in-out translate-x-full
  `;

  const bgColor = {
    success: "bg-green-50 border-l-4 border-green-400",
    error: "bg-red-50 border-l-4 border-red-400",
    info: "bg-blue-50 border-l-4 border-blue-400",
  }[type];

  const textColor = {
    success: "text-green-800",
    error: "text-red-800",
    info: "text-blue-800",
  }[type];

  toast.innerHTML = `
    <div class="p-4 ${bgColor}">
      <div class="flex">
        <div class="ml-3 w-0 flex-1">
          <p class="text-sm font-medium ${textColor}">
            ${message}
          </p>
        </div>
        <div class="ml-4 flex-shrink-0 flex">
          <button class="toast-close bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(toast);

  // Add close functionality
  const closeButton = toast.querySelector(".toast-close");
  closeButton?.addEventListener("click", () => hideToast(toastId));

  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-x-full");
    toast.classList.add("translate-x-0");
  }, 100);

  activeToasts.set(toastId, { id: toastId, element: toast });

  // Auto-hide after duration (if duration > 0)
  if (duration > 0) {
    setTimeout(() => {
      hideToast(toastId);
    }, duration);
  }

  return toastId;
}

function hideToast(toastId: string): void {
  const toast = activeToasts.get(toastId);
  if (!toast) return;

  // Animate out
  toast.element.classList.add("translate-x-full");

  // Remove after animation
  setTimeout(() => {
    toast.element.remove();
    activeToasts.delete(toastId);
  }, 300);
}
