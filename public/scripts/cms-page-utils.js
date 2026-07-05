import { marked } from 'https://cdn.jsdelivr.net/npm/marked@11.1.1/lib/marked.esm.js';
import { getApp, getApps, initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

marked.setOptions({
  gfm: true,
  breaks: true,
  mangle: false,
  headerIds: false,
});

export function createSlug(text) {
  const normalized = text?.toString().trim() ?? '';
  const base = normalized
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-ー]/gu, '');
  return base || `section-${Math.random().toString(36).slice(2, 8)}`;
}

export function markdownToHtml(markdown) {
  const html = marked.parse(markdown || '');
  const template = document.createElement('template');
  template.innerHTML = html;

  const slugCounts = new Map();
  template.content.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
    const baseSlug = createSlug(heading.textContent || '');
    const count = slugCounts.get(baseSlug) || 0;
    const finalSlug = count ? `${baseSlug}-${count}` : baseSlug;
    slugCounts.set(baseSlug, count + 1);
    heading.id = finalSlug;
  });

  return template.innerHTML;
}

export function markdownToPlain(markdown) {
  const html = marked.parse(markdown || '');
  const template = document.createElement('template');
  template.innerHTML = html;
  const text = template.content.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
}

export function extractHeadingsFromMarkdown(markdown) {
  const headings = [];
  const regex = /^(#{1,6})\s+(.+)$/gm;
  const slugCounts = new Map();
  let match;
  while ((match = regex.exec(markdown || '')) !== null) {
    const depth = match[1].length;
    const textContent = match[2].trim();
    const baseSlug = createSlug(textContent);
    const count = slugCounts.get(baseSlug) || 0;
    const finalSlug = count ? `${baseSlug}-${count}` : baseSlug;
    slugCounts.set(baseSlug, count + 1);
    headings.push({ depth, text: textContent, slug: finalSlug });
  }
  return headings;
}

export function ensureMeta(name, content, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (property) {
      el.setAttribute('property', name);
    } else {
      el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setCanonical(href) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', href);
}

export function initDatabase(firebaseConfig) {
  const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getDatabase(firebaseApp, firebaseConfig.databaseURL || undefined);
}

export function buildPaginationHtml(currentPage, totalPages, activeClass) {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  return `
      <li>
        <button class="pagination-prev px-3 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === 1 ? 'disabled' : ''}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </li>
      ${pages.map((page) => `
        <li>
          <button data-page="${page}" class="pagination-btn px-4 py-2 rounded-md ${page === currentPage ? activeClass : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}">
            ${page}
          </button>
        </li>
      `).join('')}
      <li>
        <button class="pagination-next px-3 py-2 rounded-md bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </li>
    `;
}

export function registerPageRunner(runnerKey, start) {
  if (window[runnerKey]) {
    document.removeEventListener('astro:page-load', window[runnerKey]);
  }

  window[runnerKey] = () => start();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window[runnerKey], { once: true });
  } else {
    window[runnerKey]();
  }

  document.addEventListener('astro:page-load', window[runnerKey]);
}
