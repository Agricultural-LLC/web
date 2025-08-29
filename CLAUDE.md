# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains documentation for the Agricultural Corporation Website Renewal Project (農業合同会社 Webサイトリニューアルプロジェクト). The project aims to rebuild the company's website from Google Sites to a modern static site architecture to solve SEO visibility issues and enhance information dissemination about agricultural DX (Digital Transformation).

## Project Context

- **Client**: Agricultural Corporation (農業合同会社)
- **Primary Stakeholders**: 
  - 新藤 洋介 (Business Executive)
  - 藤井 洋平 (Representative Director, Agricultural DX specialist)
  - 寺田 康佑 (Technical Advisor)
- **Goal**: Create a "platform connecting people, technology, and agriculture" with strong SEO capabilities
- **Budget Constraint**: Near-zero monthly operational costs (domain fees only ~¥1,500/year)

## Technology Stack

### Core Technologies
- **Frontend Framework**: Astro (static site generator with Content Collections for blog)
- **Hosting**: Currently GitHub Pages → Future: Firebase Hosting (low-cost with global CDN)
- **CDN/Security**: Cloudflare (free tier with DDoS protection)
- **Content Management**: Markdown-based with Astro Content Collections
- **Version Control**: GitHub

### ⚠️ CRITICAL DEPLOYMENT CONFIGURATION

**Current Status**: Deployed to GitHub Pages at `https://agricultural-llc.github.io/web/`

**IMPORTANT**: The site is currently configured with `/web/` base path for GitHub Pages deployment. When migrating to Firebase Hosting, Vercel, or Netlify, you MUST:

1. Update `astro.config.mjs`:
```javascript
// CURRENT (GitHub Pages)
site: "https://agricultural-llc.github.io/web",
base: "/web/",

// AFTER MIGRATION (Firebase/Vercel/Netlify)
site: "https://nogyo-llc.jp", // or your custom domain
base: "/",
```

2. Rebuild the project after configuration change
3. Update all internal links if hardcoded with `/web/` prefix

### Development Commands

Since this is currently a documentation repository without code implementation, common commands will be added as the project progresses. Expected commands for an Astro project:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## Site Architecture

The website consists of 5 main pages:
1. **Homepage** - Vision message, company overview, activity highlights
2. **Connect Page** (つながる) - Showcases activities with farmers, JA, and government
3. **Blog Page** (発信する) - Content categories: Beginners, Practical Know-how, Success Stories, Future of Agriculture
4. **Case Studies Page** (事例を見る) - Regional success stories with galleries
5. **Contact Page** (相談する) - Contact form with CAPTCHA

## Key Requirements

- **Performance**: Page load under 0.5 seconds, PageSpeed Insights score 95+
- **SEO**: Achieve top regional search rankings within 3-6 months
- **Blog Features**: WYSIWYG editor, auto-save, draft functionality, Note.com-equivalent UX
- **Security**: Cloudflare DDoS protection, SSL/TLS, Firebase security rules

## Development Guidelines

- Focus on static site generation for optimal performance and minimal hosting costs
- Prioritize SEO optimization in all implementations
- Ensure mobile-responsive design
- Implement structured data markup for better search visibility
- Keep operational complexity minimal for easy maintenance

## Future Expansions

- Forum functionality
- AI-powered blog automation
- Multi-language support (initially Japanese only)
- Social media integration (Note article import)