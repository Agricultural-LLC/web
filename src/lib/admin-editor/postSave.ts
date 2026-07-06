import { get, push, ref, set, update, type Database } from "firebase/database";
import { showImagePreview } from "./imageUpload";
import {
  hideLoading,
  showError,
  showInfo,
  showLoading,
  showSuccess,
  showWarning,
} from "./toast";
import {
  byId,
  type EditorConfig,
  type PostFormData,
  type SimpleMDEInstance,
} from "./types";

export interface EditorState {
  postId: string | null;
  mde: SimpleMDEInstance | null;
  pendingPostBody: string | null;
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

function getMarkdownContent(state: EditorState): string {
  if (state.mde) return state.mde.value() || "";
  const textarea = document.getElementById(
    "markdown-editor",
  ) as HTMLTextAreaElement | null;
  return textarea ? textarea.value : "";
}

export function getFormData(
  config: EditorConfig,
  state: EditorState,
): PostFormData {
  const categoriesSelect = byId<HTMLSelectElement>("categories");
  const selectedCategories = Array.from(categoriesSelect.selectedOptions).map(
    (option) => option.value,
  );
  const tagsArray = byId<HTMLInputElement>("tags")
    .value.split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
  const authorsArray = byId<HTMLInputElement>("authors")
    .value.split(",")
    .map((author) => author.trim())
    .filter((author) => author);

  const base: PostFormData = {
    title: byId<HTMLInputElement>("title").value.trim(),
    description: byId<HTMLTextAreaElement>("description").value.trim(),
    date: byId<HTMLInputElement>("date").value,
    image: byId<HTMLInputElement>("image").value.trim(),
    authors: authorsArray.length > 0 ? authorsArray : ["admin"],
    categories: selectedCategories,
    tags: tagsArray,
    body: getMarkdownContent(state),
  };

  if (!config.enableNewsFields) return base;

  return {
    ...base,
    priority: parseInt(byId<HTMLInputElement>("priority").value) || 0,
    featured: byId<HTMLInputElement>("featured").checked,
    externalLink: byId<HTMLInputElement>("externalLink").value.trim(),
    source: byId<HTMLSelectElement>("source").value,
    draft: byId<HTMLInputElement>("draft").checked,
  };
}

export function validateForm(data: PostFormData, state: EditorState): boolean {
  const errors: string[] = [];

  if (!data.title) errors.push("タイトルは必須です");
  if (!data.description) errors.push("説明は必須です");
  if (!data.date) errors.push("公開日は必須です");
  if (!data.body) errors.push("本文は必須です");
  if (data.categories.length === 0) errors.push("カテゴリーを選択してください");

  if (errors.length === 0) return true;

  showError("入力エラー", errors.join("\n"));

  if (!data.title) byId("title").focus();
  else if (!data.description) byId("description").focus();
  else if (!data.date) byId("date").focus();
  else if (!data.body && state.mde) state.mde.codemirror.focus();
  else if (data.categories.length === 0) byId("categories").focus();

  return false;
}

export function populateForm(
  config: EditorConfig,
  state: EditorState,
  post: Record<string, unknown>,
): void {
  byId<HTMLInputElement>("title").value = (post.title as string) || "";
  byId<HTMLTextAreaElement>("description").value =
    (post.description as string) || "";
  byId<HTMLInputElement>("date").value = (post.date as string) || "";
  byId<HTMLInputElement>("image").value = (post.image as string) || "";
  byId<HTMLInputElement>("authors").value = Array.isArray(post.authors)
    ? post.authors.join(", ")
    : (post.authors as string) || "admin";
  byId<HTMLInputElement>("tags").value = Array.isArray(post.tags)
    ? post.tags.join(", ")
    : (post.tags as string) || "";

  if (config.enableNewsFields) {
    byId<HTMLInputElement>("priority").value = String(post.priority || 0);
    byId<HTMLInputElement>("featured").checked = Boolean(post.featured);
    byId<HTMLInputElement>("externalLink").value =
      (post.externalLink as string) || "";
    byId<HTMLSelectElement>("source").value = (post.source as string) || "";
    byId<HTMLInputElement>("draft").checked = post.draft === true;
  }

  const categoriesSelect = byId<HTMLSelectElement>("categories");
  if (Array.isArray(post.categories)) {
    Array.from(categoriesSelect.options).forEach((option) => {
      option.selected = (post.categories as string[]).includes(option.value);
    });
  }

  const image = post.image as string | undefined;
  if (image && image.trim()) showImagePreview(image);

  state.pendingPostBody = (post.body as string) || "";
}

export async function loadPost(
  config: EditorConfig,
  state: EditorState,
  database: Database,
  postId: string,
  onLoaded: () => void,
): Promise<void> {
  try {
    showInfo("読み込み中", `${config.itemLabel}データを取得しています...`);

    const snapshot = await get(ref(database, `${config.dbPath}/${postId}`));

    if (snapshot.exists()) {
      const post = snapshot.val();
      populateForm(config, state, post);
      onLoaded();
      showSuccess(
        "読み込み完了",
        `${config.itemLabel}「${post.title}」を読み込みました`,
      );
    } else {
      showError(
        "読み込みエラー",
        `指定された${config.itemLabel}が見つかりません`,
      );
    }
  } catch (error) {
    console.error("Error loading post:", error);
    const message = error instanceof Error ? error.message : String(error);
    showError(
      "読み込みエラー",
      `${config.itemLabel}の読み込みに失敗しました: ${message}`,
    );
  }
}

function buildPostData(
  config: EditorConfig,
  formData: PostFormData,
  isCreate: boolean,
): Record<string, unknown> {
  const withTimestamp = {
    ...formData,
    updatedAt: new Date().toISOString(),
  };
  if (!config.enableNewsFields) return withTimestamp;

  const withViews = isCreate ? { ...withTimestamp, views: 0 } : withTimestamp;
  if (formData.draft) return withViews;
  return { ...withViews, publishedAt: new Date().toISOString() };
}

async function persistPost(
  config: EditorConfig,
  state: EditorState,
  database: Database,
  postData: Record<string, unknown>,
  formData: PostFormData,
  isDraft: boolean,
): Promise<{
  type: "create" | "update";
  isDraft: boolean;
  title: string;
  slug?: string;
}> {
  if (state.postId) {
    showInfo("更新中", `${config.itemLabel}データを更新しています...`);
    await update(ref(database, `${config.dbPath}/${state.postId}`), postData);
    return { type: "update", isDraft, title: formData.title };
  }

  showInfo("作成中", `新しい${config.itemLabel}を作成しています...`);
  const slug = generateSlug(formData.title);
  const createData = {
    ...postData,
    createdAt: new Date().toISOString(),
    slug,
  };

  const newPostRef = push(ref(database, config.dbPath));
  await set(newPostRef, createData);

  state.postId = newPostRef.key;
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set("id", state.postId || "");
  history.replaceState({}, "", newUrl);
  byId("page-title").textContent = config.editTitle;

  return { type: "create", isDraft, title: formData.title, slug };
}

function notifySaveResult(
  config: EditorConfig,
  result: {
    type: "create" | "update";
    isDraft: boolean;
    title: string;
    slug?: string;
  },
): void {
  const actionText = result.type === "create" ? "作成" : "更新";
  const statusText = result.isDraft ? "下書き保存" : "公開";
  let message = `${config.itemLabel}「${result.title}」が${statusText}されました。`;
  if (config.enableLinkCard && !result.isDraft && result.type === "create") {
    message += `\nスラッグ: ${result.slug}`;
  }
  showSuccess(`${actionText}完了`, message);

  if (!result.isDraft) {
    setTimeout(() => {
      showInfo(
        "公開完了",
        `${config.itemLabel}がサイトに反映されました。数分後にサイトで確認できます。`,
      );
    }, 1000);
  }
}

export async function savePost(
  config: EditorConfig,
  state: EditorState,
  database: Database,
  isDraft: boolean,
): Promise<void> {
  showLoading(
    isDraft
      ? "下書きを保存しています..."
      : `${config.itemLabel}を公開しています...`,
  );

  try {
    const formData = { ...getFormData(config, state), draft: isDraft };

    if (!validateForm(formData, state)) {
      hideLoading();
      return;
    }

    const postData = buildPostData(config, formData, !state.postId);
    const result = await persistPost(
      config,
      state,
      database,
      postData,
      formData,
      isDraft,
    );

    hideLoading();
    notifySaveResult(config, result);
  } catch (error) {
    console.error("Error saving post:", error);
    hideLoading();
    notifySaveError(config, state, isDraft, error);
  }
}

function notifySaveError(
  config: EditorConfig,
  state: EditorState,
  isDraft: boolean,
  error: unknown,
): void {
  const actionText = state.postId ? "更新" : "作成";
  const statusText = isDraft ? "下書き保存" : "公開";
  const message = error instanceof Error ? error.message : String(error);

  showError(
    `${actionText}エラー`,
    `${config.itemLabel}の${statusText}に失敗しました: ${message}`,
  );

  if (error instanceof Error && "code" in error) {
    setTimeout(() => {
      showWarning(
        "トラブルシューティング",
        "Firebase接続に問題がある可能性があります。ネットワーク接続を確認してください。",
      );
    }, 2000);
  }
}
