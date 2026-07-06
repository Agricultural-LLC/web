import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import type { BlogEntry } from "@/types";
import { createLogger } from "@/lib/logger";

const log = createLogger("firebaseLoader");

// Firebase Client SDK初期化関数（PUBLIC_変数を使用）
function initializeFirebase() {
  if (getApps().length === 0) {
    const firebaseConfig = {
      apiKey:
        import.meta.env.PUBLIC_FIREBASE_API_KEY ||
        "AIzaSyCkctZ3zzyHw0JEEf8w-wl_xVE-1lQLo7E",
      authDomain:
        import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN ||
        "agricultural-llc.firebaseapp.com",
      databaseURL:
        import.meta.env.PUBLIC_FIREBASE_DATABASE_URL ||
        "https://agricultural-llc-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId:
        import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "agricultural-llc",
      storageBucket:
        import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET ||
        "agricultural-llc.firebasestorage.app",
      messagingSenderId:
        import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "293681935404",
      appId:
        import.meta.env.PUBLIC_FIREBASE_APP_ID ||
        "1:293681935404:web:188089a29ff3da05490d89",
    };

    log.debug("Firebase Client initialization started");
    log.debug("Firebase project configured", {
      projectId:
        import.meta.env.PUBLIC_FIREBASE_PROJECT_ID || "agricultural-llc",
    });
    log.debug("Firebase database configured", {
      databaseURL:
        import.meta.env.PUBLIC_FIREBASE_DATABASE_URL ||
        "https://agricultural-llc-default-rtdb.asia-southeast1.firebasedatabase.app",
    });

    initializeApp(firebaseConfig);
    log.info("Firebase Client initialized");
  }

  const app = getApp();
  return getDatabase(app);
}

// Firebase記事の型定義
export interface FirebaseBlogEntry {
  id: string;
  title: string;
  description: string;
  body: string;
  date: string;
  image: string;
  authors: string[];
  categories: string[];
  tags: string[];
  draft: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

// BlogEntry type is now imported from @/types

// Firebaseから記事を取得
export async function getFirebaseBlogEntries(): Promise<BlogEntry[]> {
  try {
    log.info("Fetching blog entries from Firebase");
    const db = initializeFirebase();
    const snapshot = await get(ref(db, "cms/blog"));

    if (!snapshot.exists()) {
      log.info("No blog data found in Firebase");
      return [];
    }

    const data = snapshot.val();
    log.info("Raw Firebase data loaded", {
      entriesFound: Object.keys(data).length,
    });

    const entries: BlogEntry[] = [];

    for (const [id, post] of Object.entries(
      data as Record<string, FirebaseBlogEntry>,
    )) {
      // Processing entry

      if (!post.draft) {
        // 下書きは除外
        entries.push({
          id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: new Date(post.date),
          image: post.image,
          imageAlt: post.title, // デフォルトでタイトルを使用
          authors: post.authors,
          categories: post.categories,
          tags: post.tags,
          draft: post.draft,
          complexity: 1, // デフォルト値
          body: post.body,
          url: `/agritech/${post.slug}/`,
        });
      }
    }

    // 日付順でソート（新しい順）
    entries.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Successfully loaded entries
    return entries;
  } catch (error) {
    console.error("❌ Error loading Firebase blog entries:", error);
    return [];
  }
}

// 単一記事を取得
export async function getFirebaseBlogEntry(
  slug: string,
): Promise<BlogEntry | null> {
  try {
    const db = initializeFirebase();
    const snapshot = await get(ref(db, "cms/blog"));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val();

    for (const [id, post] of Object.entries(
      data as Record<string, FirebaseBlogEntry>,
    )) {
      if (post.slug === slug && !post.draft) {
        return {
          id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: new Date(post.date),
          image: post.image,
          imageAlt: post.title, // デフォルトでタイトルを使用
          authors: post.authors,
          categories: post.categories,
          tags: post.tags,
          draft: post.draft,
          complexity: 1, // デフォルト値
          body: post.body,
          url: `/agritech/${post.slug}/`,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error loading Firebase blog entry:", error);
    return null;
  }
}

// カテゴリ一覧を取得
export async function getFirebaseCategories(): Promise<string[]> {
  const entries = await getFirebaseBlogEntries();
  const categories = new Set<string>();

  entries.forEach((entry) => {
    entry.categories.forEach((category) => categories.add(category));
  });

  return Array.from(categories).sort();
}

// タグ一覧を取得
export async function getFirebaseTags(): Promise<string[]> {
  const entries = await getFirebaseBlogEntries();
  const tags = new Set<string>();

  entries.forEach((entry) => {
    entry.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

// カテゴリ別記事を取得
export async function getFirebaseBlogEntriesByCategory(
  category: string,
): Promise<BlogEntry[]> {
  const entries = await getFirebaseBlogEntries();
  return entries.filter((entry: BlogEntry) =>
    entry.categories.includes(category),
  );
}

// タグ別記事を取得
export async function getFirebaseBlogEntriesByTag(
  tag: string,
): Promise<BlogEntry[]> {
  const entries = await getFirebaseBlogEntries();
  return entries.filter((entry: BlogEntry) => entry.tags.includes(tag));
}
