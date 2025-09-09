import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { uploadImage, type UploadResult } from "../../lib/firebase/storage";

interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  previewUrl: string | null;
}

export default function ImageUploader({
  onUploadComplete,
  onUploadError,
  currentImageUrl,
  className = "",
}: ImageUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    previewUrl: currentImageUrl || null,
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejected files
      if (rejectedFiles.length > 0) {
        const error =
          rejectedFiles[0].errors[0]?.message || "無効なファイルです";
        setUploadState((prev) => ({ ...prev, error }));
        onUploadError?.(error);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Reset state and start upload
      setUploadState({
        isUploading: true,
        progress: 0,
        error: null,
        previewUrl: URL.createObjectURL(file),
      });

      try {
        // Simulate upload progress (Firebase doesn't provide real progress for small files)
        const progressInterval = setInterval(() => {
          setUploadState((prev) => ({
            ...prev,
            progress: Math.min(prev.progress + 10, 90),
          }));
        }, 200);

        // Upload to Firebase Storage
        const result: UploadResult = await uploadImage(file, "agritech");

        clearInterval(progressInterval);

        if (result.success && result.url) {
          setUploadState({
            isUploading: false,
            progress: 100,
            error: null,
            previewUrl: result.url,
          });

          onUploadComplete(result.url);
        } else {
          const error = result.error || "アップロードに失敗しました";
          setUploadState((prev) => ({
            ...prev,
            isUploading: false,
            error,
          }));
          onUploadError?.(error);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "アップロードに失敗しました";
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
          error: errorMessage,
        }));
        onUploadError?.(errorMessage);
      }
    },
    [onUploadComplete, onUploadError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false,
  });

  const handleRemoveImage = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      previewUrl: null,
    });
    onUploadComplete("");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {!uploadState.previewUrl && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            ${uploadState.isUploading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} />

          {uploadState.isUploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                アップロード中... {uploadState.progress}%
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              {isDragActive ? (
                <p className="text-blue-600">ファイルをドロップしてください</p>
              ) : (
                <div>
                  <p className="text-gray-600">
                    <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                      クリックしてファイルを選択
                    </span>
                    またはドラッグ&ドロップ
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF, WebP (最大5MB)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Preview Area */}
      {uploadState.previewUrl && !uploadState.isUploading && (
        <div className="space-y-3">
          <div className="relative inline-block">
            <img
              src={uploadState.previewUrl}
              alt="アップロードされた画像"
              className="max-w-full h-auto max-h-64 rounded-lg shadow-sm"
            />
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              title="画像を削除"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="text-sm text-gray-600">
            <p>✅ アップロード完了</p>
            <p className="text-xs text-gray-500 mt-1 break-all">
              {uploadState.previewUrl.length > 60
                ? `${uploadState.previewUrl.substring(0, 60)}...`
                : uploadState.previewUrl}
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{uploadState.error}</p>
              <button
                onClick={() =>
                  setUploadState((prev) => ({ ...prev, error: null }))
                }
                className="text-red-600 hover:text-red-500 text-xs mt-1 underline"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
