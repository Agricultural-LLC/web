import { database } from "../firebase/config";
import { ref, push, set, get, update, remove, child } from "firebase/database";
import { generateSlug } from "./utils";

export interface BlogPost {
  id?: string;
  title: string;
  description: string;
  date: string;
  image: string;
  authors: string[];
  categories: string[];
  tags: string[];
  draft: boolean;
  body: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AboutContent {
  title: string;
  description: string;
  autodescription: boolean;
  image: string;
  imageAlt: string;
  draft: boolean;
  body: string;
}

export interface HomeContent {
  image: string;
  imageAlt: string;
  title: string;
  content: string;
  button: {
    label: string;
    link: string;
  };
  body: string;
}

const CMS_PATH = "cms";

// Blog Post Operations
export async function createBlogPost(post: BlogPost): Promise<string> {
  const blogRef = ref(database, `${CMS_PATH}/blog`);
  const newPostRef = push(blogRef);

  const postData = {
    ...post,
    slug: post.slug || generateSlug(post.title),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await set(newPostRef, postData);
  return newPostRef.key!;
}

export async function getBlogPost(id: string): Promise<BlogPost | null> {
  const postRef = ref(database, `${CMS_PATH}/blog/${id}`);
  const snapshot = await get(postRef);

  if (snapshot.exists()) {
    return { id, ...snapshot.val() };
  }
  return null;
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  const blogRef = ref(database, `${CMS_PATH}/blog`);
  const snapshot = await get(blogRef);

  if (snapshot.exists()) {
    const posts = snapshot.val();
    return Object.keys(posts).map((key) => ({
      id: key,
      ...posts[key],
    }));
  }
  return [];
}

export async function updateBlogPost(
  id: string,
  updates: Partial<BlogPost>,
): Promise<void> {
  const postRef = ref(database, `${CMS_PATH}/blog/${id}`);
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await update(postRef, updateData);
}

export async function deleteBlogPost(id: string): Promise<void> {
  const postRef = ref(database, `${CMS_PATH}/blog/${id}`);
  await remove(postRef);
}

// About Content Operations
export async function updateAboutContent(content: AboutContent): Promise<void> {
  const aboutRef = ref(database, `${CMS_PATH}/about/index`);
  await set(aboutRef, content);
}

export async function getAboutContent(): Promise<AboutContent | null> {
  const aboutRef = ref(database, `${CMS_PATH}/about/index`);
  const snapshot = await get(aboutRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
}

// Home Content Operations
export async function updateHomeContent(content: HomeContent): Promise<void> {
  const homeRef = ref(database, `${CMS_PATH}/home/index`);
  await set(homeRef, content);
}

export async function getHomeContent(): Promise<HomeContent | null> {
  const homeRef = ref(database, `${CMS_PATH}/home/index`);
  const snapshot = await get(homeRef);

  if (snapshot.exists()) {
    return snapshot.val();
  }
  return null;
}
