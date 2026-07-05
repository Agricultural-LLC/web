import { showError, showInfo, showSuccess } from "./toast";
import type { SimpleMDEInstance } from "./types";

export function setupEditorDragDrop(
  mde: SimpleMDEInstance,
  uploadImage: (file: File) => Promise<string>,
): void {
  if (!mde || !mde.codemirror) return;

  const codemirror = mde.codemirror;
  const wrapper = codemirror.getWrapperElement();

  wrapper.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapper.classList.add("drag-over");
  });

  wrapper.addEventListener("dragleave", (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapper.classList.remove("drag-over");
  });

  wrapper.addEventListener("drop", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    wrapper.classList.remove("drag-over");

    const files = (e as DragEvent).dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      showError("ファイルエラー", "画像ファイルのみドロップできます");
      return;
    }

    try {
      showInfo("アップロード中", `${file.name} をアップロードしています...`);
      const imageUrl = await uploadImage(file);
      const cursor = codemirror.getCursor();
      codemirror.replaceRange(`![${file.name}](${imageUrl})`, cursor);
      showSuccess("アップロード完了", "画像がエディタに追加されました");
    } catch (error) {
      console.error("Image upload error:", error);
      const message = error instanceof Error ? error.message : String(error);
      showError(
        "アップロードエラー",
        `画像のアップロードに失敗しました: ${message}`,
      );
    }
  });
}
