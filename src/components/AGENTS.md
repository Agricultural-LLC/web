# components

## Overview

Source module `src/components`.

## Structure

- about/ about page layouts
- admin/ React admin widgets
- agritech/ agritech page components
- base/ global layout, header, footer, theme, background
- common/ shared UI primitives
- home/ home page components
- news/ news components
- search/ search UI

## Notes

- Prefer existing Astro component patterns before introducing new abstractions.
- Keep global SEO, favicon, manifest, and JSON-LD changes in `base/BaseLayout.astro`.
- Hide or remove placeholder social links instead of publishing generic social accounts.

## Related

- Parent: [src/AGENTS.md](../AGENTS.md)
