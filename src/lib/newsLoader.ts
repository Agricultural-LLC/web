import { initializeApp, getApp, getApps } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import type { NewsEntry } from "@/types";

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

    initializeApp(firebaseConfig);
  }

  const app = getApp();
  return getDatabase(app);
}

// Firebase記事の型定義
export interface FirebaseNewsEntry {
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
  priority?: number;
  featured?: boolean;
  externalLink?: string;
  source?: string;
  views?: number;
  publishedAt?: string;
}

// Firebaseからニュース記事を取得
export async function getFirebaseNewsEntries(): Promise<NewsEntry[]> {
  try {
    const db = initializeFirebase();
    const snapshot = await get(ref(db, "cms/news"));

    if (!snapshot.exists()) {
      return [];
    }

    const data = snapshot.val();

    const entries: NewsEntry[] = [];

    for (const [id, post] of Object.entries(
      data as Record<string, FirebaseNewsEntry>,
    )) {

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
          body: post.body,
          url: `/news/${post.slug}/`,
          priority: post.priority || 0,
          featured: post.featured || false,
          externalLink: post.externalLink,
          source: post.source,
          views: post.views || 0,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(post.date),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date(post.createdAt || post.date),
          createdAt: post.createdAt ? new Date(post.createdAt) : new Date(post.date),
        });
      }
    }

    // 優先度と日付順でソート（新しい順）
    entries.sort((a, b) => {
      // 優先度が高いもの（数値が大きいもの）を先に
      if (a.priority !== b.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      // 同じ優先度の場合は日付順
      return b.date.getTime() - a.date.getTime();
    });

    return entries;
  } catch (error) {
    console.error("❌ Error loading Firebase news entries:", error);
    return [];
  }
}

// 単一ニュース記事を取得
export async function getFirebaseNewsEntry(
  slug: string,
): Promise<NewsEntry | null> {
  try {
    const db = initializeFirebase();
    const snapshot = await get(ref(db, "cms/news"));

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.val();

    for (const [id, post] of Object.entries(
      data as Record<string, FirebaseNewsEntry>,
    )) {
      if (post.slug === slug && !post.draft) {
        return {
          id,
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: new Date(post.date),
          image: post.image,
          imageAlt: post.title,
          authors: post.authors,
          categories: post.categories,
          tags: post.tags,
          draft: post.draft,
          body: post.body,
          url: `/news/${post.slug}/`,
          priority: post.priority || 0,
          featured: post.featured || false,
          externalLink: post.externalLink,
          source: post.source,
          views: post.views || 0,
          publishedAt: post.publishedAt ? new Date(post.publishedAt) : new Date(post.date),
          updatedAt: post.updatedAt ? new Date(post.updatedAt) : new Date(post.createdAt || post.date),
          createdAt: post.createdAt ? new Date(post.createdAt) : new Date(post.date),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Error loading Firebase news entry:", error);
    return null;
  }
}

// トップニュース（特集記事）を取得
export async function getFeaturedNewsEntries(limit: number = 3): Promise<NewsEntry[]> {
  try {
    const allEntries = await getFirebaseNewsEntries();
    
    // 特集記事を優先度順で取得
    const featuredEntries = allEntries
      .filter(entry => entry.featured)
      .slice(0, limit);
    
    // 特集記事が足りない場合は、優先度の高い記事で補完
    if (featuredEntries.length < limit) {
      const remainingLimit = limit - featuredEntries.length;
      const otherEntries = allEntries
        .filter(entry => !entry.featured)
        .slice(0, remainingLimit);
      
      return [...featuredEntries, ...otherEntries];
    }
    
    return featuredEntries;
  } catch (error) {
    console.error("Error loading featured news entries:", error);
    return [];
  }
}

// 最新ニュースを取得
export async function getLatestNewsEntries(limit: number = 5): Promise<NewsEntry[]> {
  try {
    const allEntries = await getFirebaseNewsEntries();
    return allEntries.slice(0, limit);
  } catch (error) {
    console.error("Error loading latest news entries:", error);
    return [];
  }
}

// カテゴリ別ニュース記事を取得
export async function getFirebaseNewsEntriesByCategory(
  category: string,
): Promise<NewsEntry[]> {
  const entries = await getFirebaseNewsEntries();
  return entries.filter((entry: NewsEntry) =>
    entry.categories.includes(category),
  );
}

// タグ別ニュース記事を取得
export async function getFirebaseNewsEntriesByTag(
  tag: string,
): Promise<NewsEntry[]> {
  const entries = await getFirebaseNewsEntries();
  return entries.filter((entry: NewsEntry) => entry.tags.includes(tag));
}

// ニュースカテゴリ一覧を取得
export async function getFirebaseNewsCategories(): Promise<string[]> {
  const entries = await getFirebaseNewsEntries();
  const categories = new Set<string>();

  entries.forEach((entry) => {
    entry.categories.forEach((category) => categories.add(category));
  });

  return Array.from(categories).sort();
}

// ニュースタグ一覧を取得
export async function getFirebaseNewsTags(): Promise<string[]> {
  const entries = await getFirebaseNewsEntries();
  const tags = new Set<string>();

  entries.forEach((entry) => {
    entry.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

// ニュース検索機能
export async function searchFirebaseNewsEntries(
  query: string,
  category?: string,
  tag?: string,
): Promise<NewsEntry[]> {
  try {
    let entries = await getFirebaseNewsEntries();
    
    // カテゴリフィルタ
    if (category) {
      entries = entries.filter(entry => 
        entry.categories.includes(category)
      );
    }
    
    // タグフィルタ
    if (tag) {
      entries = entries.filter(entry => 
        entry.tags.includes(tag)
      );
    }
    
    // テキスト検索
    if (query) {
      const searchQuery = query.toLowerCase();
      entries = entries.filter(entry => 
        entry.title.toLowerCase().includes(searchQuery) ||
        entry.description.toLowerCase().includes(searchQuery) ||
        entry.body?.toLowerCase().includes(searchQuery) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    }
    
    return entries;
  } catch (error) {
    console.error("Error searching news entries:", error);
    return [];
  }
}
