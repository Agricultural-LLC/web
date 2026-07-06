export type ContentType = "blog" | "news";

export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface EditorConfig {
  contentType: ContentType;
  dbPath: string;
  storagePrefix: string;
  itemLabel: string;
  editTitle: string;
  createTitle: string;
  enableLinkCard: boolean;
  enableNewsFields: boolean;
  linkPreviewEndpoint: string;
  firebase: FirebaseWebConfig;
}

export interface PostFormData {
  title: string;
  description: string;
  date: string;
  image: string;
  authors: string[];
  categories: string[];
  tags: string[];
  body: string;
  draft?: boolean;
  priority?: number;
  featured?: boolean;
  externalLink?: string;
  source?: string;
  views?: number;
}

export interface LinkCardData {
  url: string;
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
  favicon?: string;
  error?: boolean;
  message?: string;
}

// SimpleMDE is loaded from CDN as a global; minimal structural typing.
export interface SimpleMDEInstance {
  value(): string;
  codemirror: {
    focus(): void;
    getCursor(): unknown;
    replaceRange(text: string, cursor: unknown): void;
    getWrapperElement(): HTMLElement;
  };
  isPreviewActive(): boolean;
  toTextArea(): void;
}

declare global {
  interface Window {
    SimpleMDE?: new (options: Record<string, unknown>) => SimpleMDEInstance;
  }
}

export const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element not found: ${id}`);
  return el as T;
};
