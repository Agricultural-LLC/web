import { get, ref } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

import {
  buildPaginationHtml,
  ensureMeta,
  extractHeadingsFromMarkdown,
  initDatabase,
  markdownToHtml,
  markdownToPlain,
  registerPageRunner,
  setCanonical,
} from '/scripts/cms-page-utils.js';

const ITEMS_PER_PAGE = 6;
const RUNNER_KEY = '__agritechPageRunner';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function initAgritechPage({ firebaseConfig, baseDescription, baseTitle, siteName, siteOrigin }) {
  const database = initDatabase(firebaseConfig);

  const state = {
    allEntries: [],
    filteredEntries: [],
    currentPage: 1,
    currentCategory: 'all',
    currentTag: 'all',
    currentSort: 'date-desc',
  };

  let eventController = new AbortController();

  function resetState() {
    state.allEntries = [];
    state.filteredEntries = [];
    state.currentPage = 1;
    state.currentCategory = 'all';
    state.currentTag = 'all';
    state.currentSort = 'date-desc';
  }

  function getRoot() {
    return document.querySelector('[data-agritech-root]');
  }

  function getElements() {
    return {
      loadingEl: document.getElementById('agri-loading'),
      listViewEl: document.getElementById('agri-list-view'),
      detailViewEl: document.getElementById('agri-detail-view'),
      emptyEl: document.getElementById('agri-empty'),
      notFoundEl: document.getElementById('agri-not-found'),
      listCountEl: document.getElementById('agri-list-count'),
      postsListEl: document.getElementById('agri-posts-list'),
      paginationEl: document.getElementById('agri-pagination'),
      sortSelectEl: document.getElementById('agri-sort-select'),
      activeFiltersEl: document.getElementById('agri-active-filters'),
      sidebarCategoriesEl: document.getElementById('agri-categories'),
      sidebarTagsEl: document.getElementById('agri-tags'),
      detailArticleEl: document.getElementById('agri-detail-article'),
      detailTocEl: document.getElementById('agri-detail-toc'),
      relatedEl: document.getElementById('agri-related'),
      relatedListEl: document.getElementById('agri-related-list'),
    };
  }

  function removeStructuredData() {
    document.querySelectorAll('script[data-agri-ld]').forEach((script) => script.remove());
  }

  function updateHeadForList(totalCount) {
    const title = `${baseTitle} | ${siteName}`;
    document.title = title;
    ensureMeta('description', baseDescription);
    ensureMeta('og:title', title, true);
    ensureMeta('og:description', `${baseDescription}（全${totalCount}件）`, true);
    ensureMeta('og:type', 'website', true);
    ensureMeta('twitter:card', 'summary_large_image');
    setCanonical(`${siteOrigin}/agritech/`);

    removeStructuredData();
  }

  function updateHeadForDetail(entry, description) {
    const title = `${entry.title} | ${siteName}`;
    document.title = title;
    ensureMeta('description', description);
    ensureMeta('og:title', entry.title, true);
    ensureMeta('og:description', description, true);
    ensureMeta('og:type', 'article', true);
    if (entry.image) {
      ensureMeta('og:image', entry.image, true);
      ensureMeta('twitter:image', entry.image);
    }
    ensureMeta('twitter:card', 'summary_large_image');
    setCanonical(`${siteOrigin}/agritech/${entry.slug || entry.id}/`);

    removeStructuredData();
    const primaryDate = entry.date ? new Date(entry.date).toISOString() : undefined;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: entry.title,
      description,
      image: entry.image ? [entry.image] : undefined,
      datePublished: primaryDate,
      dateModified: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : primaryDate,
      author: (entry.authors || []).map((name) => ({ '@type': 'Person', name })),
      publisher: {
        '@type': 'Organization',
        name: siteName,
        logo: {
          '@type': 'ImageObject',
          url: `${siteOrigin}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${siteOrigin}/agritech/${entry.slug || entry.id}/`,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.agriLd = 'article';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);
  }

  function normalizeEntry(id, value) {
    if (!value || typeof value !== 'object') return null;
    const ensureString = (input) => (typeof input === 'string' ? input : input ? String(input) : '');
    const ensureArray = (input) => Array.isArray(input)
      ? input.filter((item) => item != null).map((item) => String(item))
      : input
        ? [String(input)]
        : [];

    return {
      id,
      slug: ensureString(value.slug) || id,
      title: ensureString(value.title),
      description: ensureString(value.description),
      body: ensureString(value.body),
      date: ensureString(value.date),
      image: ensureString(value.image),
      authors: ensureArray(value.authors),
      categories: ensureArray(value.categories),
      tags: ensureArray(value.tags),
      draft: Boolean(value.draft),
      updatedAt: ensureString(value.updatedAt),
    };
  }

  function toggleView(view) {
    const { loadingEl, listViewEl, detailViewEl, emptyEl, notFoundEl } = getElements();
    if (loadingEl) loadingEl.classList.toggle('hidden', view !== 'loading');
    if (listViewEl) listViewEl.classList.toggle('hidden', view !== 'list');
    if (detailViewEl) detailViewEl.classList.toggle('hidden', view !== 'detail');
    if (emptyEl) emptyEl.classList.toggle('hidden', view !== 'empty');
    if (notFoundEl) notFoundEl.classList.toggle('hidden', view !== 'notFound');
  }

  function sortEntries(entries) {
    const sortKey = state.currentSort;
    return [...entries].sort((a, b) => {
      if (sortKey === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortKey === 'title') {
        return (a.title || '').localeCompare(b.title || '', 'ja');
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  function renderSidebar() {
    const { sidebarCategoriesEl, sidebarTagsEl } = getElements();
    if (sidebarCategoriesEl) {
      const counts = new Map();
      state.allEntries.forEach((entry) => {
        (entry.categories || []).forEach((category) => {
          counts.set(category, (counts.get(category) || 0) + 1);
        });
      });
      const items = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ja'));
      sidebarCategoriesEl.innerHTML = items.length
        ? items.map(([category, count]) => {
            const isActive = state.currentCategory === category;
            const baseClass = 'inline-flex items-center justify-between gap-2 px-3 py-1 rounded-full text-sm border transition-colors';
            const activeClass = 'bg-green-600 text-white border-green-600';
            const inactiveClass = 'bg-white text-gray-700 border-green-200 hover:bg-green-50';
            const href = `/agritech/categories/${encodeURIComponent(category)}/`;
            return `<a href="${href}" class="${baseClass} ${isActive ? activeClass : inactiveClass}">
              <span>${category}</span>
              <span class="text-xs">${count}</span>
            </a>`;
          }).join('')
        : '<p class="text-sm text-gray-500">カテゴリーがまだありません</p>';
    }

    if (sidebarTagsEl) {
      const counts = new Map();
      state.allEntries.forEach((entry) => {
        (entry.tags || []).forEach((tag) => {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        });
      });
      const items = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ja'));
      sidebarTagsEl.innerHTML = items.length
        ? items.map(([tag, count]) => {
            const isActive = state.currentTag === tag;
            const baseClass = 'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border transition-colors';
            const activeClass = 'bg-green-600 text-white border-green-600';
            const inactiveClass = 'bg-white text-gray-700 border-green-200 hover:bg-green-50';
            const href = `/agritech/tags/${encodeURIComponent(tag)}/`;
            return `<a href="${href}" class="${baseClass} ${isActive ? activeClass : inactiveClass}">
              <span>#${tag}</span>
              <span class="text-xs">${count}</span>
            </a>`;
          }).join('')
        : '<p class="text-sm text-gray-500">タグがまだありません</p>';
    }
  }

  function renderActiveFilters() {
    const { activeFiltersEl } = getElements();
    if (!activeFiltersEl) return;

    const chips = [];
    if (state.currentCategory !== 'all') {
      chips.push(`<a href="/agritech/" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm hover:bg-green-200">
        カテゴリー: ${escapeHtml(state.currentCategory)}
        <span aria-hidden="true">×</span>
      </a>`);
    }
    if (state.currentTag !== 'all') {
      chips.push(`<a href="/agritech/" class="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm hover:bg-green-200">
        タグ: ${escapeHtml(state.currentTag)}
        <span aria-hidden="true">×</span>
      </a>`);
    }

    if (!chips.length) {
      activeFiltersEl.classList.add('hidden');
      activeFiltersEl.innerHTML = '';
      return;
    }

    activeFiltersEl.classList.remove('hidden');
    activeFiltersEl.innerHTML = chips.join('');
  }

  function applyFilters() {
    let entries = [...state.allEntries];
    if (state.currentCategory !== 'all') {
      entries = entries.filter((entry) => entry.categories.includes(state.currentCategory));
    }
    if (state.currentTag !== 'all') {
      entries = entries.filter((entry) => entry.tags.includes(state.currentTag));
    }
    return sortEntries(entries);
  }

  function renderPosts() {
    const { postsListEl, listCountEl } = getElements();
    if (!postsListEl || !listCountEl) return;

    listCountEl.textContent = String(state.filteredEntries.length);

    const totalPages = Math.max(1, Math.ceil(state.filteredEntries.length / ITEMS_PER_PAGE));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const visibleEntries = state.filteredEntries.slice(startIndex, endIndex);

    postsListEl.innerHTML = visibleEntries.map((entry) => {
      const href = `/agritech/${entry.slug}/`;
      const publishedDate = entry.date
        ? new Date(entry.date).toLocaleDateString('ja-JP')
        : '';
      const datetimeAttr = entry.date ? new Date(entry.date).toISOString() : '';
      return `
        <div class="mb-6">
          <a href="${href}" class="block glass rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <article class="p-6">
              <h2 class="text-2xl font-bold mb-2 dark:text-white">${entry.title || ''}</h2>
              <p class="text-gray-600 dark:text-gray-300 mb-4">${entry.description || ''}</p>
              <div class="flex flex-wrap gap-2 text-sm text-gray-500">
                ${publishedDate ? `<span><time datetime="${datetimeAttr}">${publishedDate}</time></span>` : ''}
                ${(entry.categories || []).map((cat) => `<span class="px-2 py-1 bg-green-100 text-green-800 rounded">${cat}</span>`).join('')}
              </div>
            </article>
          </a>
        </div>
      `;
    }).join('');
  }

  function renderPagination() {
    const { paginationEl } = getElements();
    if (!paginationEl) return;

    const totalPages = Math.ceil(state.filteredEntries.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    paginationEl.innerHTML = buildPaginationHtml(state.currentPage, totalPages, 'bg-green-600 text-white');
  }

  function renderActiveAndSidebar() {
    renderSidebar();
    renderActiveFilters();
  }

  function renderListView() {
    renderActiveAndSidebar();
    state.filteredEntries = applyFilters();

    if (!state.filteredEntries.length) {
      const { listCountEl } = getElements();
      if (listCountEl) listCountEl.textContent = '0';
      toggleView('empty');
      return;
    }

    renderPosts();
    renderPagination();
    updateHeadForList(state.filteredEntries.length);

    const { sortSelectEl } = getElements();
    if (sortSelectEl) sortSelectEl.value = state.currentSort;

    toggleView('list');
  }

  function buildToc(headings) {
    const { detailTocEl } = getElements();
    if (!detailTocEl) return;

    const relevant = headings.filter((heading) => heading.depth <= 3);
    if (!relevant.length) {
      detailTocEl.classList.add('hidden');
      detailTocEl.innerHTML = '';
      return;
    }

    detailTocEl.classList.remove('hidden');
    detailTocEl.innerHTML = `
      <div class="glass rounded-lg p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">目次</h2>
        <ul class="space-y-2 text-sm text-gray-700">
          ${relevant.map((heading) => `
            <li style="margin-left: ${(heading.depth - 1) * 12}px">
              <a href="#${heading.slug}" class="hover:text-green-600">
                ${heading.text}
              </a>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  function hydrateLinkCards() {
    const placeholders = document.querySelectorAll('.link-card-placeholder');
    placeholders.forEach(async (placeholder) => {
      const url = placeholder.getAttribute('data-url');
      if (!url) return;

      try {
        const response = await Promise.race([
          fetch('https://us-central1-agricultural-llc.cloudfunctions.net/api/link-preview', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Origin': window.location.origin,
            },
            body: JSON.stringify({ url }),
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);

        if (response.ok) {
          const data = await response.json();
          placeholder.outerHTML = createLinkCardHTML(data.url, data.title, data.description, data.image, data.siteName);
          return;
        }
      } catch (_) {
        // Ignore network failures, fall back to simple link.
      }

      const fallback = new URL(url, window.location.origin);
      placeholder.outerHTML = createLinkCardHTML(url, fallback.hostname, 'リンク先をご確認ください。', '', fallback.hostname);
    });
  }

  function createLinkCardHTML(url, title, description, image, cardSiteName) {
    const safeUrl = escapeHtml(url);
    const safeTitle = escapeHtml(title || '');
    const safeDescription = escapeHtml(description || '');
    const safeImage = escapeHtml(image || '');
    const safeSiteName = escapeHtml(cardSiteName || '');
    return `
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer"
        class="block border border-green-100 rounded-xl p-4 hover:border-green-300 transition-colors bg-white/70">
        <div class="flex gap-4 items-center">
          ${safeImage ? `<img src="${safeImage}" alt="${safeTitle}" class="w-16 h-16 object-cover rounded-lg" />` : ''}
          <div>
            <p class="text-sm text-green-600 font-semibold">${safeSiteName}</p>
            <h3 class="text-base font-bold text-gray-900">${safeTitle}</h3>
            <p class="text-sm text-gray-600 mt-1">${safeDescription}</p>
          </div>
        </div>
      </a>
    `;
  }

  function renderRelated(entry) {
    const { relatedEl, relatedListEl } = getElements();
    if (!relatedEl || !relatedListEl) return;

    const related = state.allEntries
      .filter((item) => item.id !== entry.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    if (!related.length) {
      relatedEl.classList.add('hidden');
      relatedListEl.innerHTML = '';
      return;
    }

    relatedEl.classList.remove('hidden');
    relatedListEl.innerHTML = related.map((item) => {
      const href = `/agritech/${item.slug}/`;
      const publishedDate = item.date ? new Date(item.date).toLocaleDateString('ja-JP') : '';
      const datetimeAttr = item.date ? new Date(item.date).toISOString() : '';
      return `
        <article class="glass rounded-lg p-6 hover:shadow-lg transition-shadow">
          <a href="${href}" class="block">
            <h3 class="text-xl font-semibold text-gray-900 mb-3">${item.title || ''}</h3>
            <p class="text-gray-600 mb-4">${item.description || ''}</p>
            <div class="flex flex-wrap gap-2 text-sm text-gray-500">
              ${publishedDate ? `<span><time datetime="${datetimeAttr}">${publishedDate}</time></span>` : ''}
              ${(item.categories || []).map((cat) => `<span class="px-2 py-1 bg-green-100 text-green-800 rounded">${cat}</span>`).join('')}
            </div>
          </a>
        </article>
      `;
    }).join('');
  }

  function renderDetail(entry) {
    const { detailArticleEl } = getElements();
    if (!detailArticleEl) return;

    const formattedDate = entry.date
      ? new Date(entry.date).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
    const dateIso = entry.date ? new Date(entry.date).toISOString() : '';

    detailArticleEl.innerHTML = `
      <header class="mb-10">
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">${entry.title || ''}</h1>
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          ${formattedDate ? `<time datetime="${dateIso}">${formattedDate}</time>` : ''}
          ${(entry.categories || []).map((category) => `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">${category}</span>`).join('')}
          ${(entry.tags || []).map((tag) => `<span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">#${tag}</span>`).join('')}
        </div>
      </header>
      ${entry.image ? `
        <figure class="mb-10">
          <img
            src="${entry.image}"
            alt="${entry.title || ''}"
            class="w-full rounded-lg shadow-lg"
            loading="eager"
          />
        </figure>
      ` : ''}
      <div class="prose prose-lg max-w-none mb-10">
        <div>${markdownToHtml(entry.body || '')}</div>
      </div>
    `;

    buildToc(extractHeadingsFromMarkdown(entry.body || ''));
    hydrateLinkCards();
    renderRelated(entry);

    const description = entry.description || markdownToPlain(entry.body || '').slice(0, 140);
    updateHeadForDetail(entry, description);
    toggleView('detail');
  }

  function getRouteInfo() {
    const basePath = '/agritech';
    const path = window.location.pathname.replace(/\/+$/, '');
    let suffix = '';
    if (path.startsWith(basePath)) {
      suffix = decodeURIComponent(path.slice(basePath.length)).replace(/^\/+/, '');
    }

    if (!suffix) {
      return { mode: 'list' };
    }

    if (suffix.startsWith('categories/')) {
      const category = suffix.slice('categories/'.length).replace(/\/+$/, '');
      return { mode: 'category', value: category };
    }

    if (suffix.startsWith('tags/')) {
      const tag = suffix.slice('tags/'.length).replace(/\/+$/, '');
      return { mode: 'tag', value: tag };
    }

    if (suffix.startsWith('page/')) {
      const pageSegment = suffix.slice('page/'.length).replace(/\/+$/, '');
      const pageNumber = Number(pageSegment);
      return { mode: 'page', page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1 };
    }

    return { mode: 'detail', slug: suffix };
  }

  async function loadEntries(routeInfo) {
    toggleView('loading');
    try {
      const snapshot = await get(ref(database, 'cms/blog'));
      if (!snapshot.exists()) {
        resetState();
        toggleView('empty');
        return;
      }

      const raw = snapshot.val();
      state.allEntries = Object.entries(raw)
        .map(([id, value]) => normalizeEntry(id, value))
        .filter((entry) => entry && !entry.draft);

      if (!state.allEntries.length) {
        resetState();
        toggleView('empty');
        return;
      }

      const url = new URL(window.location.href);
      const requestedSort = url.searchParams.get('sort');
      if (requestedSort && ['date-desc', 'date-asc', 'title'].includes(requestedSort)) {
        state.currentSort = requestedSort;
      } else {
        state.currentSort = 'date-desc';
      }

      if (routeInfo.mode === 'detail') {
        const entry = state.allEntries.find((item) => item.slug === routeInfo.slug || item.id === routeInfo.slug);
        if (!entry) {
          toggleView('notFound');
          return;
        }
        renderDetail(entry);
        return;
      }

      if (routeInfo.mode === 'category') {
        state.currentCategory = routeInfo.value || 'all';
        state.currentTag = 'all';
      } else if (routeInfo.mode === 'tag') {
        state.currentTag = routeInfo.value || 'all';
        state.currentCategory = 'all';
      } else {
        state.currentCategory = 'all';
        state.currentTag = 'all';
      }

      if (routeInfo.mode === 'page') {
        state.currentPage = routeInfo.page || 1;
      } else {
        state.currentPage = 1;
      }

      renderListView();
    } catch (error) {
      console.error('Failed to load agritech entries:', error);
      toggleView('notFound');
    }
  }

  function onSortChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    state.currentSort = target.value;
    state.currentPage = 1;

    const url = new URL(window.location.href);
    if (state.currentSort === 'date-desc') {
      url.searchParams.delete('sort');
    } else {
      url.searchParams.set('sort', state.currentSort);
    }
    history.replaceState({}, '', url.toString());

    renderListView();
  }

  function onPaginationClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest('button');
    if (!(button instanceof HTMLButtonElement) || button.disabled) return;

    if (button.classList.contains('pagination-prev')) {
      state.currentPage = Math.max(1, state.currentPage - 1);
    } else if (button.classList.contains('pagination-next')) {
      const totalPages = Math.ceil(state.filteredEntries.length / ITEMS_PER_PAGE);
      state.currentPage = Math.min(totalPages, state.currentPage + 1);
    } else if (button.dataset.page) {
      state.currentPage = Number(button.dataset.page);
    }

    renderListView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetEventBindings() {
    eventController.abort();
    eventController = new AbortController();
  }

  function bindEvents() {
    resetEventBindings();
    const signal = eventController.signal;
    const { sortSelectEl, paginationEl } = getElements();
    sortSelectEl?.addEventListener('change', onSortChange, { signal });
    paginationEl?.addEventListener('click', onPaginationClick, { signal });
  }

  function start() {
    const root = getRoot();
    if (!root) {
      resetEventBindings();
      return;
    }

    const { loadingEl, listViewEl, detailViewEl } = getElements();
    if (!loadingEl || !listViewEl || !detailViewEl) {
      return;
    }

    resetState();
    bindEvents();
    loadEntries(getRouteInfo());
  }

  registerPageRunner(RUNNER_KEY, start);
}
