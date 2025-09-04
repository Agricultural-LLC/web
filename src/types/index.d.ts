import type { MarkdownHeading } from "astro";
import type { CollectionEntry, CollectionKey } from "astro:content";

export type GenericEntry = CollectionEntry<CollectionKey>;

export type AboutEntry = CollectionEntry<"about">;
export type BlogEntry = CollectionEntry<"blog">;
export type HomeEntry = CollectionEntry<"home">;

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

export type Project = {
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  link?: string;
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
