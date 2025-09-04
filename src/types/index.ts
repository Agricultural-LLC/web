import type { CollectionEntry } from "astro:content";

export interface MarkdownHeading {
  depth: number;
  slug: string;
  text: string;
}

// Generic entry type for content collections
export type GenericEntry = CollectionEntry<any>;

// Search related types
export interface SearchableEntry {
  id: string;
  slug: string;
  title: string;
  description?: string;
  content: string;
  collection: string;
}

// Heading hierarchy for table of contents
export interface HeadingHierarchy extends MarkdownHeading {
  subheadings: HeadingHierarchy[];
}

// Blog post types
export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  authors?: string[];
  categories?: string[];
  tags?: string[];
  draft: boolean;
  content: string;
  sha?: string;
}

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string | Date;
  authors?: string[];
  categories?: string[];
  tags?: string[];
  draft: boolean;
}

// User and authentication types
export interface User {
  id: string;
  username: string;
  role: "admin" | "editor";
}

export interface AuthToken {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PostsResponse {
  posts: BlogPost[];
}

export interface PostResponse {
  post: BlogPost;
}

// Form types
export interface LoginFormData {
  username: string;
  password: string;
}
