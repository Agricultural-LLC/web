# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the production code for the Agricultural Corporation Website (農業合同会社 Webサイト). The project successfully migrated from Google Sites to a modern static site architecture, achieving strong SEO capabilities and enhanced information dissemination about agricultural DX (Digital Transformation).

## Project Context

- **Client**: Agricultural Corporation (農業合同会社)
- **Primary Stakeholders**: 
  - 新藤 洋介 (Business Executive)
  - 藤井 洋平 (Representative Director, Agricultural DX specialist)
  - 寺田 康佑 (Technical Advisor)
- **Mission**: A "platform connecting people, technology, and agriculture"
- **Budget**: Near-zero monthly operational costs (Firebase Hosting is free)

## Current Technology Stack

### Core Technologies
- **Frontend Framework**: Astro v5.12.8 (static site generator with Content Collections)
- **Styling**: Tailwind CSS
- **UI Components**: React (for interactive components)
- **Hosting**: Firebase Hosting (fast, reliable, with GitHub Actions CI/CD)
- **Search**: Fuse.js (client-side fuzzy search)
- **Forms**: SSGform (serverless form handling)
- **Content Management**: Separated CMS architecture (see CMS Architecture section below)
- **Version Control**: GitHub

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (http://localhost:4321/)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Format code
npm run format

# Type checking
npx tsc --noEmit

# Clean cache (if needed)
rm -rf node_modules/.vite .astro
```

## CMS Architecture

This project uses an **integrated CMS architecture** for streamlined content management:

### Architecture Overview

```
[Unified Website & CMS System]
├─ Repository: Agricultural-LLC/web
├─ Hosting: Firebase Hosting
├─ Public Site: https://agricultural-llc.web.app/
├─ Admin Interface: https://agricultural-llc.web.app/admin/
├─ Data Storage: Firebase Realtime Database
├─ File Storage: Firebase Storage
└─ Authentication: Firebase Auth

[Content Flow]
Admin Interface → Firebase Database → Dynamic Content Rendering
```

### CMS Features

- **Real-time Editing**: SimpleMDE markdown editor with live preview
- **Image Management**: Firebase Storage with drag-and-drop upload
- **Draft System**: Save drafts before publishing
- **Category & Tags**: Flexible content categorization
- **Authentication**: Secure Firebase Auth integration
- **Responsive Design**: Mobile-friendly admin interface

### Content Management Process

1. **Access Admin**: Navigate to `/admin/` and authenticate
2. **Create/Edit**: Use the integrated editor with markdown support
3. **Upload Media**: Drag-and-drop images with automatic optimization
4. **Preview & Publish**: Review content before publishing
5. **Real-time Updates**: Changes appear immediately on the site

## Site Architecture

The website consists of the following pages:
1. **Homepage** (`/`) - Vision message, company overview, activity highlights
2. **About Page** (`/about/`) - Company information and leadership profiles
3. **Connect Page** (`/connect/`) - Activities with farmers, JA, and government
4. **Blog** (`/blog/`) - Agricultural DX information and insights
5. **Case Studies** (`/cases/`) - Regional success stories
6. **Contact Page** (`/contact/`) - Contact form with validation
7. **Search** (`/search/`) - Full-text search across all content

## Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow existing component patterns
- Maintain consistent Tailwind CSS usage
- Keep components modular and reusable
- NO comments unless specifically requested

### Performance
- Page load under 0.5 seconds
- PageSpeed Insights score 95+
- Optimize images using Astro's Image component
- Minimize JavaScript bundle size

### SEO Optimization
- Use semantic HTML
- Implement structured data markup
- Ensure proper meta tags
- Maintain clean URL structure
- Optimize for regional search rankings

### Content Management
- Blog posts managed via Firebase Realtime Database
- Admin interface at `/admin/blog/` for content editing
- Images stored in Firebase Storage with automatic optimization
- Real-time content updates without site rebuilds

## File Structure

```
src/
├── assets/        # Images and static assets
│   ├── agriculture/  # Agricultural images
│   └── backgrounds/  # Background patterns
├── components/    # Astro/React components
│   ├── admin/     # CMS admin components
│   ├── base/      # Layout components
│   ├── blog/      # Blog-specific components
│   ├── common/    # Shared components
│   ├── home/      # Homepage components
│   └── search/    # Search functionality
├── content/       # Static markdown content
│   ├── about/     # About page content
│   └── home/      # Homepage content
├── lib/           # Utility functions
│   ├── firebase/ # Firebase integration
│   └── cms/       # CMS-specific utilities
├── pages/         # Page routes
│   ├── admin/     # CMS admin interface
│   └── api/       # API endpoints
├── styles/        # Global styles
└── types/         # TypeScript definitions
```

## Recent Updates & Maintenance

### Completed Optimizations
- ✅ Unified logo usage across all pages
- ✅ Standardized CTA sections
- ✅ Fixed search component hydration issues
- ✅ Resolved TypeScript configuration
- ✅ Removed unused components and assets
- ✅ Improved form accessibility

### Common Issues & Solutions

**Vite Optimization Errors:**
```bash
rm -rf node_modules/.vite .astro
npm install
npm run dev
```

**Search Component Issues:**
- Ensure Fuse.js is included in Vite optimizeDeps
- Use .tsx extension in imports explicitly

**TypeScript Errors:**
- Run `npx tsc --noEmit` to check for type errors
- Ensure tsconfig.json extends Astro's strict config

## Deployment

### GitHub Pages (Production)
- Automatic deployment on push to `main` branch
- GitHub Actions workflow handles build and deploy
- Site available at: https://agricultural-llc.github.io/web/

### Branch Strategy
- `main` - Production (auto-deploys)
- `dev` - Development/staging
- `feature/*` - Feature development

## Testing Checklist

Before deploying:
- [ ] Run `npm run build` successfully
- [ ] Test all pages locally
- [ ] Verify search functionality
- [ ] Test contact form
- [ ] Check mobile responsiveness
- [ ] Validate TypeScript (no errors)
- [ ] PageSpeed Insights score > 95

## Important Notes

- **Always** test builds locally before pushing to main
- **Never** commit sensitive information or API keys
- **Maintain** SEO best practices in all updates
- **Optimize** images before adding to the repository
- **Follow** the existing code patterns and conventions

## Support & Contact

For technical questions about this codebase:
- Review this document first
- Check existing code patterns
- Test locally before deploying
- Use semantic commit messages

---

🤖 This codebase is maintained with Claude Code assistance.