import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import app from "./config";

// Initialize Firebase Storage
const storage = getStorage(app);

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

/**
 * Upload image to Firebase Storage
 */
export async function uploadImage(
  file: File,
  directory = "agritech",
): Promise<UploadResult> {
  try {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      return {
        success: false,
        error: "アップロードできるのは画像ファイルのみです",
      };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "ファイルサイズは5MB以下にしてください",
      };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const fileExtension = file.name.split(".").pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;

    // Create storage reference
    const storageRef = ref(storage, `${directory}/${fileName}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      fileName,
    };
  } catch (error) {
    console.error("Image upload error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "アップロードに失敗しました",
    };
  }
}

/**
 * Delete image from Firebase Storage
 */
export async function deleteImage(
  fileName: string,
  directory = "agritech",
): Promise<boolean> {
  try {
    const storageRef = ref(storage, `${directory}/${fileName}`);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("Image delete error:", error);
    return false;
  }
}

/**
 * Generate optimized image URL with query parameters
 * This is a simple implementation - in production you might want to use a CDN
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality = 85,
): string {
  // For now, return the original URL
  // In the future, this could integrate with ImageKit, Cloudinary, etc.
  return url;
}

/**
 * Convert Firebase Storage URL to a more manageable format for markdown
 */
export function getMarkdownImageUrl(firebaseUrl: string): string {
  // For blog posts, we can use the Firebase URL directly
  return firebaseUrl;
}

export { storage };
