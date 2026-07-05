import {
  get,
  increment,
  ref,
  update,
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

import {
  buildPaginationHtml,
  ensureMeta,
  initDatabase,
  markdownToHtml,
  markdownToPlain,
  registerPageRunner,
  setCanonical,
} from '/scripts/cms-page-utils.js';

const ITEMS_PER_PAGE = 9;
const RUNNER_KEY = '__newsPageRunner';

export function initNewsPage({ firebaseConfig, baseDescription, baseTitle, siteName, siteOrigin }) {
  const database = initDatabase(firebaseConfig);

  const state = {
    allNews: [],
    filteredNews: [],
    currentPage: 1,
    currentCategory: 'all',
    currentSort: 'date-desc',
  };

  let eventController = new AbortController();

  function resetState() {
    state.allNews = [];
    state.filteredNews = [];
    state.currentPage = 1;
    state.currentCategory = 'all';
    state.currentSort = 'date-desc';
  }

  function getRoot() {
    return document.querySelector('[data-news-root]');
  }

  function getElements() {
    return {
      loadingEl: document.getElementById('news-loading'),
      listViewEl: document.getElementById('news-list-view'),
      detailViewEl: document.getElementById('news-detail-view'),
      notFoundEl: document.getElementById('news-not-found'),
      emptyEl: document.getElementById('news-empty'),
      categoryFiltersEl: document.getElementById('category-filters'),
      newsListEl: document.getElementById('news-list'),
      paginationEl: document.getElementById('pagination'),
      showingCountEl: document.getElementById('showing-count'),
      totalCountEl: document.getElementById('total-count'),
      sortSelectEl: document.getElementById('sort-select'),
      detailContentEl: document.getElementById('news-detail-content'),
      relatedNewsSectionEl: document.getElementById('related-news-section'),
      relatedNewsListEl: document.getElementById('related-news-list'),
      pageTitleEl: document.getElementById('page-title'),
      pageDescEl: document.getElementById('page-description'),
      breadcrumbCurrentEl: document.getElementById('breadcrumb-current'),
    };
  }

  function getRouteInfo() {
    const basePath = '/news';
    const path = window.location.pathname.replace(/\/+$/, '');
    let slug = '';
    if (path.startsWith(basePath)) {
      slug = decodeURIComponent(path.slice(basePath.length)).replace(/^\/+/, '');
    }
    return {
      isDetail: slug.length > 0,
      slug,
    };
  }

  function removeStructuredData() {
    document.querySelectorAll('script[data-dynamic-ld]').forEach((script) => script.remove());
  }

  function injectArticleStructuredData(entry, description) {
    const primaryDate = entry.publishedAt || entry.date;
    const secondaryDate = entry.updatedAt || entry.date;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: entry.title,
      description,
      image: entry.image ? [entry.image] : undefined,
      datePublished: primaryDate ? new Date(primaryDate).toISOString() : undefined,
      dateModified: secondaryDate ? new Date(secondaryDate).toISOString() : undefined,
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
        '@id': `${siteOrigin}/news/${entry.slug || entry.id}/`,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.dynamicLd = 'article';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);
  }

  function injectItemListStructuredData(entries) {
    if (!entries.length) return;
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: entries.map((entry, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteOrigin}/news/${entry.slug || entry.id}/`,
        name: entry.title,
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.dataset.dynamicLd = 'itemlist';
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.appendChild(script);
  }

  function updateHeadForList(totalCount) {
    const title = `${baseTitle} | ${siteName}`;
    document.title = title;
    ensureMeta('description', baseDescription);
    ensureMeta('og:title', title, true);
    ensureMeta('og:description', `${baseDescription}（全${totalCount}件）`, true);
    ensureMeta('og:type', 'website', true);
    ensureMeta('twitter:card', 'summary_large_image');
    setCanonical(`${siteOrigin}/news/`);

    removeStructuredData();
    injectItemListStructuredData(state.filteredNews.slice(0, Math.min(10, state.filteredNews.length)));
  }

  function updateHeadForArticle(entry, description) {
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
    setCanonical(`${siteOrigin}/news/${entry.slug || entry.id}/`);

    removeStructuredData();
    injectArticleStructuredData(entry, description);
  }

  function toggleView(view) {
    const {
      loadingEl,
      listViewEl,
      detailViewEl,
      notFoundEl,
      emptyEl,
    } = getElements();

    if (loadingEl) loadingEl.classList.toggle('hidden', view !== 'loading');
    if (listViewEl) listViewEl.classList.toggle('hidden', view !== 'list');
    if (detailViewEl) detailViewEl.classList.toggle('hidden', view !== 'detail');
    if (notFoundEl) notFoundEl.classList.toggle('hidden', view !== 'notFound');
    if (emptyEl) emptyEl.classList.toggle('hidden', view !== 'empty');
  }

  function sortEntries(entries) {
    const sortKey = state.currentSort;
    return [...entries].sort((a, b) => {
      if (sortKey === 'date-asc') {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      if (sortKey === 'priority') {
        return (b.priority || 0) - (a.priority || 0);
      }
      if (sortKey === 'views') {
        return (b.views || 0) - (a.views || 0);
      }
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  function renderCategoryFilters() {
    const { categoryFiltersEl } = getElements();
    if (!categoryFiltersEl) return;

    const categories = [...new Set(state.allNews.flatMap((entry) => entry.categories || []))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'ja'));

    const buildButton = (category, label, count, active) => {
      const baseClass = 'category-filter px-4 py-2 rounded-full text-sm font-medium transition-all duration-200';
      const activeClass = 'bg-purple-600 text-white';
      const inactiveClass = 'bg-white text-gray-700 hover:bg-purple-100';
      return `<button data-category="${category}" class="${baseClass} ${active ? activeClass : inactiveClass}">
        ${label} (${count})
      </button>`;
    };

    const allButton = buildButton('all', 'すべて', state.allNews.length, state.currentCategory === 'all');

    const categoryButtons = categories
      .map((category) => {
        const count = state.allNews.filter((entry) => entry.categories?.includes(category)).length;
        return buildButton(category, category, count, state.currentCategory === category);
      })
      .join('');

    categoryFiltersEl.innerHTML = `${allButton}${categoryButtons}`;
  }

  function applyFilters() {
    const baseEntries = state.currentCategory === 'all'
      ? [...state.allNews]
      : state.allNews.filter((entry) => entry.categories?.includes(state.currentCategory));
    return sortEntries(baseEntries);
  }

  function buildNewsCardHtml(news) {
    const internalSlug = news.slug || news.id;
    const href = internalSlug ? `/news/${internalSlug}/` : '#news';
    const publishedDate = news.date
      ? new Date(news.date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' })
      : '';
    const datetimeAttr = news.date ? new Date(news.date).toISOString() : '';
    const hasImage = Boolean(news.image);
    return `
        <div class="news-item flex justify-center">
          <article class="w-full max-w-sm bg-white/60 backdrop-blur-sm border border-purple-100/50 rounded-xl shadow-lg overflow-hidden hover:bg-white/80 transition-all duration-300 h-full">
            ${hasImage ? `
              <a href="${href}" class="block aspect-video overflow-hidden bg-gray-100">
                <img
                  src="${news.image}"
                  alt="${news.title || ''}"
                  class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </a>
            ` : `
              <a href="${href}" class="block aspect-video overflow-hidden bg-gray-100"></a>
            `}
            <div class="p-5">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  ${news.featured ? `
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100/70 text-purple-700">
                      特集
                    </span>` : ''}
                  ${news.categories?.[0] ? `
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100/70 text-blue-700">
                      ${news.categories[0]}
                    </span>` : ''}
                </div>
                ${publishedDate ? `
                  <time class="text-xs text-gray-500" datetime="${datetimeAttr}">
                    ${publishedDate}
                  </time>` : ''}
              </div>
              <h3 class="text-base font-bold text-gray-900 mb-2 line-clamp-2">
                <a href="${href}" class="hover:text-purple-600 transition-colors">
                  ${news.title || ''}
                </a>
              </h3>
              ${news.description ? `
                <p class="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                  ${news.description}
                </p>` : ''}
              <div class="flex items-center justify-end">
                <a href="${href}" class="text-purple-600 hover:text-purple-800 text-sm font-medium inline-flex items-center gap-1 group">
                  続きを読む
                  <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </article>
        </div>
      `;
  }

  function renderNewsList() {
    const { newsListEl, showingCountEl, totalCountEl } = getElements();
    if (!newsListEl || !showingCountEl || !totalCountEl) return;

    const totalPages = Math.max(1, Math.ceil(state.filteredNews.length / ITEMS_PER_PAGE));
    if (state.currentPage > totalPages) {
      state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const visibleNews = state.filteredNews.slice(startIndex, endIndex);

    newsListEl.innerHTML = visibleNews.map((news) => buildNewsCardHtml(news)).join('');

    showingCountEl.textContent = String(Math.min(endIndex, state.filteredNews.length));
    totalCountEl.textContent = String(state.filteredNews.length);
  }

  function renderPagination() {
    const { paginationEl } = getElements();
    if (!paginationEl) return;

    const totalPages = Math.ceil(state.filteredNews.length / ITEMS_PER_PAGE);
    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    paginationEl.innerHTML = buildPaginationHtml(state.currentPage, totalPages, 'bg-purple-600 text-white');
  }

  function renderListView() {
    renderCategoryFilters();
    state.filteredNews = applyFilters();

    if (!state.filteredNews.length) {
      const { showingCountEl, totalCountEl } = getElements();
      if (showingCountEl) showingCountEl.textContent = '0';
      if (totalCountEl) totalCountEl.textContent = '0';
      toggleView('empty');
      return;
    }

    renderNewsList();
    renderPagination();
    updateHeadForList(state.filteredNews.length);

    const { pageTitleEl, pageDescEl, breadcrumbCurrentEl } = getElements();
    if (pageTitleEl) pageTitleEl.textContent = 'ニュース';
    if (pageDescEl) pageDescEl.textContent = baseDescription;
    if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = 'ニュース';

    toggleView('list');
  }

  function renderRelatedNews(currentId) {
    const { relatedNewsSectionEl, relatedNewsListEl } = getElements();
    if (!relatedNewsSectionEl || !relatedNewsListEl) return;

    const related = state.allNews
      .filter((entry) => entry.id !== currentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    if (!related.length) {
      relatedNewsSectionEl.classList.add('hidden');
      relatedNewsListEl.innerHTML = '';
      return;
    }

    relatedNewsSectionEl.classList.remove('hidden');
    relatedNewsListEl.innerHTML = related.map((news) => {
      const internalSlug = news.slug || news.id;
      const href = internalSlug ? `/news/${internalSlug}/` : '#news';
      const publishedDate = news.date
        ? new Date(news.date).toLocaleDateString('ja-JP')
        : '';
      const datetimeAttr = news.date ? new Date(news.date).toISOString() : '';
      return `
        <article class="bg-white/60 backdrop-blur-sm border border-purple-100/50 rounded-xl shadow-lg overflow-hidden hover:bg-white/80 transition-all duration-300">
          ${news.image ? `
            <a href="${href}" class="block aspect-video overflow-hidden bg-gray-100">
              <img
                src="${news.image}"
                alt="${news.title || ''}"
                class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                loading="lazy"
              />
            </a>` : ''}
          <div class="p-5">
            <h3 class="text-base font-bold text-gray-900 mb-2 line-clamp-2">
              <a href="${href}" class="hover:text-purple-600 transition-colors">
                ${news.title || ''}
              </a>
            </h3>
            <p class="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
              ${news.description || ''}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-500 mb-4">
              ${publishedDate ? `<time datetime="${datetimeAttr}">${publishedDate}</time>` : '<span></span>'}
              ${(news.categories || []).slice(0, 1).map((cat) => `<span class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">${cat}</span>`).join('')}
            </div>
            <div class="flex items-center justify-end">
              <a href="${href}" class="text-purple-600 hover:text-purple-800 text-sm font-medium inline-flex items-center gap-1 group">
                続きを読む
                <svg class="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function buildDetailBadgeHtml(entry) {
    return `
      <div class="flex items-center gap-3 mb-6 flex-wrap">
        ${entry.featured ? `
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            特集記事
          </span>` : ''}
        ${(entry.categories || []).map((category) => `
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            ${category}
          </span>
        `).join('')}
      </div>
    `;
  }

  function buildDetailMetaHtml(entry) {
    const formattedDate = entry.date
      ? new Date(entry.date).toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '';
    const dateIso = entry.date ? new Date(entry.date).toISOString() : '';

    const authors = Array.isArray(entry.authors)
      ? entry.authors.join(', ')
      : entry.authors || '';

    return `
      <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
        ${formattedDate ? `
          <time datetime="${dateIso}" class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            ${formattedDate}
          </time>` : ''}
        ${entry.source ? `
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" />
            </svg>
            ${entry.source}
          </span>` : ''}
        ${typeof entry.views === 'number' ? `
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
            ${entry.views} views
          </span>` : ''}
        ${authors ? `
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
            </svg>
            ${authors}
          </span>` : ''}
      </div>
    `;
  }

  function buildDetailBodySections(entry) {
    const descriptionHtml = entry.description
      ? `
        <div class="mb-8 p-6 bg-gray-50 rounded-lg border-l-4 border-purple-500">
          <p class="text-lg text-gray-700 leading-relaxed">
            ${entry.description}
          </p>
        </div>
      `
      : '';

    const imageHtml = entry.image
      ? `
        <figure class="mb-10">
          <img
            src="${entry.image}"
            alt="${entry.imageAlt || entry.title || ''}"
            class="w-full rounded-lg shadow-lg"
            loading="eager"
          />
        </figure>
      `
      : '';

    const bodyHtml = `
      <div class="prose prose-lg max-w-none mb-10">
        <div>${markdownToHtml(entry.body || '')}</div>
      </div>
    `;

    const externalLinkHtml = entry.externalLink
      ? `
        <div class="mb-10 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-sm text-blue-800 mb-2">外部リンク：</p>
          <a href="${entry.externalLink}" target="_blank" rel="noopener noreferrer"
             class="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1">
            ${entry.externalLink}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      `
      : '';

    const tagsHtml = (entry.tags || []).length
      ? `
        <div class="flex flex-wrap gap-2 mb-10">
          ${(entry.tags || []).map((tag) => `
            <span class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
              #${tag}
            </span>
          `).join('')}
        </div>
      `
      : '';

    return { descriptionHtml, imageHtml, bodyHtml, externalLinkHtml, tagsHtml };
  }

  function renderDetail(entry) {
    const {
      detailContentEl,
      pageTitleEl,
      pageDescEl,
      breadcrumbCurrentEl,
    } = getElements();

    if (!detailContentEl) return;

    const { descriptionHtml, imageHtml, bodyHtml, externalLinkHtml, tagsHtml } = buildDetailBodySections(entry);

    detailContentEl.innerHTML = `
      <header class="mb-10">
        ${buildDetailBadgeHtml(entry)}
        <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
          ${entry.title || ''}
        </h1>
        ${buildDetailMetaHtml(entry)}
      </header>
      ${imageHtml}
      ${descriptionHtml}
      ${bodyHtml}
      ${externalLinkHtml}
      ${tagsHtml}
      <div class="border-t border-gray-200 pt-8">
        <a href="/news/" class="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          ニュース一覧に戻る
        </a>
      </div>
    `;

    if (pageTitleEl) pageTitleEl.textContent = entry.title || 'ニュース';
    if (pageDescEl) pageDescEl.textContent = entry.description || baseDescription;
    if (breadcrumbCurrentEl) breadcrumbCurrentEl.textContent = entry.title || '詳細';

    const description = entry.description || markdownToPlain(entry.body || '').slice(0, 120);
    updateHeadForArticle(entry, description);
    renderRelatedNews(entry.id);
    toggleView('detail');
  }

  async function incrementViews(id) {
    if (!id) return;
    try {
      const targetRef = ref(database, `cms/news/${id}`);
      await update(targetRef, { views: increment(1) });
    } catch (error) {
      console.warn('Failed to increment news views:', error);
    }
  }

  function normalizeEntry(id, value) {
    if (!value || typeof value !== 'object') return null;
    const ensureString = (input) => (typeof input === 'string' ? input : input ? String(input) : '');
    const ensureArray = (input) => Array.isArray(input)
      ? input.filter((item) => item != null).map((item) => String(item))
      : input
        ? [String(input)]
        : [];
    const ensureNumber = (input, fallback = 0) => {
      if (typeof input === 'number' && Number.isFinite(input)) return input;
      const parsed = Number(input);
      return Number.isFinite(parsed) ? parsed : fallback;
    };

    return {
      id,
      slug: ensureString(value.slug) || id,
      title: ensureString(value.title),
      description: ensureString(value.description),
      date: ensureString(value.date),
      image: ensureString(value.image),
      imageAlt: ensureString(value.imageAlt) || ensureString(value.title),
      authors: ensureArray(value.authors),
      categories: ensureArray(value.categories),
      tags: ensureArray(value.tags),
      draft: Boolean(value.draft),
      body: ensureString(value.body),
      priority: ensureNumber(value.priority, 0),
      featured: Boolean(value.featured),
      externalLink: ensureString(value.externalLink),
      source: ensureString(value.source),
      views: ensureNumber(value.views, 0),
      publishedAt: ensureString(value.publishedAt),
      updatedAt: ensureString(value.updatedAt),
      createdAt: ensureString(value.createdAt),
    };
  }

  async function loadNews(routeInfo) {
    toggleView('loading');
    try {
      const snapshot = await get(ref(database, 'cms/news'));
      if (!snapshot.exists()) {
        resetState();
        toggleView('empty');
        return;
      }

      const raw = snapshot.val();
      state.allNews = Object.entries(raw)
        .map(([id, value]) => normalizeEntry(id, value))
        .filter((entry) => entry && !entry.draft);

      if (!state.allNews.length) {
        resetState();
        toggleView('empty');
        return;
      }

      if (routeInfo.isDetail) {
        const entry = state.allNews.find(
          (item) => item.slug === routeInfo.slug || item.id === routeInfo.slug,
        );
        if (!entry) {
          toggleView('notFound');
          return;
        }
        renderDetail(entry);
        await incrementViews(entry.id);
        return;
      }

      const url = new URL(window.location.href);
      const requestedCategory = url.searchParams.get('category');
      const requestedSort = url.searchParams.get('sort');

      state.currentCategory = requestedCategory || 'all';
      if (requestedSort && ['date-desc', 'date-asc', 'priority', 'views'].includes(requestedSort)) {
        state.currentSort = requestedSort;
      } else {
        state.currentSort = 'date-desc';
      }
      state.currentPage = 1;

      renderListView();
    } catch (error) {
      console.error('Failed to load news:', error);
      toggleView('notFound');
    }
  }

  function onCategoryFilterClick(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains('category-filter')) return;

    state.currentCategory = target.dataset.category || 'all';
    state.currentPage = 1;
    renderListView();

    const url = new URL(window.location.href);
    if (state.currentCategory === 'all') {
      url.searchParams.delete('category');
    } else {
      url.searchParams.set('category', state.currentCategory);
    }
    history.replaceState({}, '', url.toString());
  }

  function onSortChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    state.currentSort = target.value;
    state.currentPage = 1;
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
      const totalPages = Math.ceil(state.filteredNews.length / ITEMS_PER_PAGE);
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
    const { categoryFiltersEl, sortSelectEl, paginationEl } = getElements();

    categoryFiltersEl?.addEventListener('click', onCategoryFilterClick, { signal });
    sortSelectEl?.addEventListener('change', onSortChange, { signal });
    paginationEl?.addEventListener('click', onPaginationClick, { signal });
  }

  const start = () => {
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
    loadNews(getRouteInfo());
  };

  registerPageRunner(RUNNER_KEY, start);
}
