import { onAuthStateChanged, signOut, type Auth } from "firebase/auth";
import { setupEditorDragDrop } from "./editorDragDrop";
import { initFirebase } from "./firebaseClient";
import { initializeImageUpload, uploadImageAndGetUrl } from "./imageUpload";
import { createLinkCardRenderer, initLinkCardDialog } from "./linkCard";
import { loadPost, savePost, type EditorState } from "./postSave";
import { byId, type EditorConfig, type SimpleMDEInstance } from "./types";

const ALLOWED_EMAILS = [
  "shindoy@gmail.com",
  "yohei.fujii.eg@gmail.com",
  "company@cor-jp.com",
];

function readConfig(): EditorConfig {
  const el = document.getElementById("editor-config");
  if (!el || !el.textContent) throw new Error("editor-config not found");
  return JSON.parse(el.textContent) as EditorConfig;
}

function buildToolbar(
  config: EditorConfig,
  showUrlDialog: (() => void) | null,
): unknown[] {
  const linkCardButton = showUrlDialog
    ? [
        {
          name: "linkcard",
          action: () => showUrlDialog(),
          className: "fa fa-credit-card",
          title: "リンクカード挿入",
        },
      ]
    : [];

  return [
    "bold",
    "italic",
    "heading",
    "|",
    "quote",
    "unordered-list",
    "ordered-list",
    "|",
    "link",
    "image",
    ...linkCardButton,
    "|",
    "preview",
    "fullscreen",
    "|",
    "guide",
  ];
}

function createEditorShower(
  config: EditorConfig,
  state: EditorState,
  uploadImage: (file: File) => Promise<string>,
  showUrlDialog: (() => void) | null,
  markdownToHtml: ((markdown: string) => string) | null,
): () => void {
  return () => {
    byId("loading").classList.add("hidden");
    byId("editor-content").classList.remove("hidden");

    if (!window.SimpleMDE || state.mde) return;

    const initialValue = state.pendingPostBody || "";
    const textarea = byId<HTMLTextAreaElement>("markdown-editor");
    textarea.value = initialValue;

    const options: Record<string, unknown> = {
      element: textarea,
      initialValue,
      spellChecker: false,
      status: ["autosave", "lines", "words", "cursor"],
      toolbar: buildToolbar(config, showUrlDialog),
      shortcuts: {
        togglePreview: "Ctrl-P",
        toggleFullScreen: "F11",
      },
    };
    if (markdownToHtml) {
      options.previewRender = (plainText: string) => markdownToHtml(plainText);
    }

    state.mde = new window.SimpleMDE(options);

    setTimeout(() => {
      if (state.mde) setupEditorDragDrop(state.mde, uploadImage);
    }, 500);

    state.pendingPostBody = null;
  };
}

function initializeEditorFlow(
  config: EditorConfig,
  state: EditorState,
  database: Parameters<typeof loadPost>[2],
  showEditor: () => void,
): void {
  byId<HTMLInputElement>("date").value = new Date().toISOString().split("T")[0];

  const urlParams = new URLSearchParams(window.location.search);
  state.postId = urlParams.get("id");

  if (state.postId) {
    byId("page-title").textContent = config.editTitle;
    loadPost(config, state, database, state.postId, showEditor);
  } else {
    byId("page-title").textContent = config.createTitle;
    showEditor();
  }
}

function registerLifecycleHandlers(
  config: EditorConfig,
  state: EditorState,
): void {
  window.addEventListener("beforeunload", () => {
    if (state.mde) {
      state.mde.toTextArea();
      state.mde = null;
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.mde) {
      const content = state.mde.value();
      if (content && state.postId) {
        localStorage.setItem(
          `${config.contentType}_draft_${state.postId}`,
          content,
        );
      }
    }
  });
}

function onAuthorized(
  config: EditorConfig,
  state: EditorState,
  auth: Auth,
): void {
  const { database, storage } = initializedServices;
  const uploadCtx = {
    storage,
    storagePrefix: config.storagePrefix,
    itemLabel: config.itemLabel,
    themeColor: config.enableNewsFields ? "purple" : "blue",
  };
  const uploadImage = (file: File) => uploadImageAndGetUrl(uploadCtx, file);

  const getMde = (): SimpleMDEInstance | null => state.mde;
  const linkCardTools = config.enableLinkCard
    ? {
        dialog: initLinkCardDialog(config.linkPreviewEndpoint, getMde),
        renderer: createLinkCardRenderer(config.linkPreviewEndpoint, getMde),
      }
    : null;

  const showEditor = createEditorShower(
    config,
    state,
    uploadImage,
    linkCardTools ? linkCardTools.dialog.showUrlDialog : null,
    linkCardTools ? linkCardTools.renderer.markdownToHtml : null,
  );

  byId("logout-button").addEventListener("click", () => signOut(auth));
  byId("save-draft-button").addEventListener("click", () =>
    savePost(config, state, database, true),
  );
  byId("publish-button").addEventListener("click", () =>
    savePost(config, state, database, false),
  );

  initializeEditorFlow(config, state, database, showEditor);
  initializeImageUpload(uploadCtx);
  registerLifecycleHandlers(config, state);
}

let initializedServices: ReturnType<typeof initFirebase>;
let editorInitialized = false;

export function initAdminEditor(): void {
  const config = readConfig();
  initializedServices = initFirebase(config.firebase);
  const { auth } = initializedServices;

  const state: EditorState = { postId: null, mde: null, pendingPostBody: null };

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "/admin/";
      return;
    }

    if (!user.email || !ALLOWED_EMAILS.includes(user.email)) {
      alert("権限エラー: 管理者権限が必要です");
      window.location.href = "/admin/";
      return;
    }

    byId("user-email").textContent = user.email;

    if (editorInitialized) return;
    editorInitialized = true;
    onAuthorized(config, state, auth);
  });
}
