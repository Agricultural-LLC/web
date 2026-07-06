import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
  uploadBytesResumable,
  type FirebaseStorage,
} from "firebase/storage";
import { showError, showInfo, showSuccess } from "./toast";
import { byId } from "./types";

const MAX_SIZE = 5 * 1024 * 1024;

export interface UploadContext {
  storage: FirebaseStorage;
  storagePrefix: string;
  itemLabel: string;
  themeColor: string;
}

function uniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2);
  const fileExtension = originalName.split(".").pop();
  return `${timestamp}_${randomString}.${fileExtension}`;
}

function uploadMetadata(file: File) {
  return {
    contentType: file.type,
    customMetadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
    },
  };
}

export function showImagePreview(imageUrl: string): void {
  byId<HTMLImageElement>("preview-image").src = imageUrl;
  byId("upload-dropzone").classList.add("hidden");
  byId("image-preview").classList.remove("hidden");
  byId("upload-error").classList.add("hidden");
}

function resetUploadUI(): void {
  byId("upload-content").classList.remove("hidden");
  byId("upload-progress").classList.add("hidden");
  byId("progress-bar").style.width = "0%";
  byId("upload-error").classList.add("hidden");
}

function removeImage(ctx: UploadContext): void {
  byId<HTMLInputElement>("image").value = "";
  byId<HTMLImageElement>("preview-image").src = "";
  byId("image-preview").classList.add("hidden");
  byId("upload-dropzone").classList.remove("hidden");
  byId("upload-error").classList.add("hidden");
  resetUploadUI();
  showInfo("画像削除", `${ctx.itemLabel}画像を削除しました`);
}

function validateImageFile(file: File): boolean {
  if (!file.type.startsWith("image/")) {
    showError(
      "ファイルエラー",
      "アップロードできるのは画像ファイル（PNG, JPG, GIF, WebP）のみです",
    );
    return false;
  }
  if (file.size > MAX_SIZE) {
    showError(
      "ファイルサイズエラー",
      `ファイルサイズは5MB以下にしてください（現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`,
    );
    return false;
  }
  return true;
}

function handleFileUpload(ctx: UploadContext, file: File): void {
  if (!validateImageFile(file)) return;

  showInfo("アップロード開始", `${file.name} をアップロードしています...`);

  byId("upload-content").classList.add("hidden");
  byId("upload-progress").classList.remove("hidden");
  byId("upload-error").classList.add("hidden");

  const fileRef = storageRef(
    ctx.storage,
    `${ctx.storagePrefix}/${uniqueFileName(file.name)}`,
  );
  const uploadTask = uploadBytesResumable(fileRef, file, uploadMetadata(file));

  uploadTask.on(
    "state_changed",
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      byId("progress-bar").style.width = progress + "%";
    },
    (error) => {
      console.error("Upload error:", error);
      showError(
        "アップロードエラー",
        `画像のアップロードに失敗しました: ${error.message}`,
      );
      resetUploadUI();
    },
    async () => {
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        byId<HTMLInputElement>("image").value = downloadURL;
        showImagePreview(downloadURL);
        resetUploadUI();
        showSuccess(
          "アップロード完了",
          `${file.name} が正常にアップロードされました`,
        );
      } catch (error) {
        console.error("Error getting download URL:", error);
        showError(
          "URL取得エラー",
          "画像URLの取得に失敗しました。再度お試しください。",
        );
        resetUploadUI();
      }
    },
  );
}

export async function uploadImageAndGetUrl(
  ctx: Pick<UploadContext, "storage" | "storagePrefix">,
  file: File,
): Promise<string> {
  if (file.size > MAX_SIZE) {
    throw new Error(
      `ファイルサイズは5MB以下にしてください（現在: ${(file.size / 1024 / 1024).toFixed(2)}MB）`,
    );
  }

  const fileRef = storageRef(
    ctx.storage,
    `${ctx.storagePrefix}/${uniqueFileName(file.name)}`,
  );
  const snapshot = await uploadBytes(fileRef, file, uploadMetadata(file));
  return getDownloadURL(snapshot.ref);
}

export function initializeImageUpload(ctx: UploadContext): void {
  const uploadDropzone = byId("upload-dropzone");
  const uploadProgress = byId("upload-progress");
  const dragClasses = [
    `border-${ctx.themeColor}-400`,
    `bg-${ctx.themeColor}-50`,
  ];

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  uploadDropzone.addEventListener("click", () => {
    if (!uploadProgress.classList.contains("hidden")) return;
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const files = (e.target as HTMLInputElement).files;
    if (files && files.length > 0) handleFileUpload(ctx, files[0]);
  });

  uploadDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadDropzone.classList.add(...dragClasses);
  });

  uploadDropzone.addEventListener("dragleave", (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove(...dragClasses);
  });

  uploadDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadDropzone.classList.remove(...dragClasses);
    const files = (e as DragEvent).dataTransfer?.files;
    if (files && files.length > 0) handleFileUpload(ctx, files[0]);
  });

  byId("remove-image").addEventListener("click", () => removeImage(ctx));
}
