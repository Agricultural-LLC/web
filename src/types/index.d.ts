import type { MarkdownHeading } from "astro";
import type { CollectionEntry, CollectionKey } from "astro:content";

export type GenericEntry = CollectionEntry<CollectionKey>;

export type AboutEntry = CollectionEntry<"about">;
export type HomeEntry = CollectionEntry<"home">;

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

export type SearchableEntry = AboutEntry | BlogEntry | HomeEntry;

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

export interface HeadingHierarchy extends MarkdownHeading {
  children?: HeadingHierarchy[];
}

export type MenuItem = {
  title?: string;
  id: string;
  children: MenuItem[];
};

// Define the type for menu items to created nested object
export type MenuItemWithDraft = {
  title?: string;
  id: string;
  draft: boolean;
  children: MenuItemWithDraft[];
};

// Define the props for the SideNavMenu component
export type SideNavMenuProps = {
  items: MenuItemWithDraft[];
  level: number;
  currentPage: string;
  className?: string;
};
