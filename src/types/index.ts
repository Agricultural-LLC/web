import type { MarkdownHeading } from "astro";
import type { CollectionEntry, CollectionKey } from "astro:content";

export type GenericEntry = CollectionEntry<CollectionKey>;

export type AboutEntry = CollectionEntry<"about">;
export type HomeEntry = CollectionEntry<"home">;

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
  children?: HeadingHierarchy[];
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

// Firebase BlogEntry type (not using Astro collections)
export interface BlogEntry {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: Date;
  image: string;
  imageAlt?: string;
  authors: string[];
  categories: string[];
  tags: string[];
  draft: boolean;
  complexity?: number;
  body?: string;
  url?: string;
  autodescription?: boolean;
  hideToc?: boolean;
}

// Firebase NewsEntry type for news management
export interface NewsEntry {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: Date;
  image: string;
  imageAlt?: string;
  authors: string[];
  categories: string[];
  tags: string[];
  draft: boolean;
  body?: string;
  url?: string;
  // News-specific fields
  priority?: number; // For featured news
  featured?: boolean; // Top news flag
  externalLink?: string; // Link to external news source
  source?: string; // News source (e.g., "プレスリリース", "業界ニュース")
  views?: number; // View count for analytics
  publishedAt?: Date; // Actual publication date
  updatedAt?: Date; // Last update timestamp
  createdAt?: Date; // Creation timestamp
}

export type SearchableEntryUnion = AboutEntry | BlogEntry | NewsEntry | HomeEntry;

export type SocialLinks = {
  discord?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
};

export type Author = {
  name: string;
  image?: string;
  imageAlt?: string;
  social?: SocialLinks;
};

export type Button = {
  label: string;
  link?: string;
  newtab?: boolean;
  hoverInvert?: boolean;
  color?: string;
};

export type MenuItem = {
  title?: string;
  id: string;
  children: MenuItem[];
};

export type MenuItemWithDraft = {
  title?: string;
  id: string;
  draft: boolean;
  children: MenuItemWithDraft[];
};

export type SideNavMenuProps = {
  items: MenuItemWithDraft[];
  level: number;
  currentPage: string;
  className?: string;
};
