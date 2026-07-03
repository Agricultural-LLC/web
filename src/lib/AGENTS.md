# lib

## Overview

Source module `src/lib`.

## Structure

- cms/ CMS operations, auth, sync, and helpers
- firebase/ Firebase client/public config and storage helpers

## Notes

- Keep Firebase project IDs, database URLs, and storage bucket names stable unless a data migration is explicitly requested.
- Do not replace Cloud Functions endpoints with public domain strings unless the backend route is actually migrated.

## Related

- Parent: [src/AGENTS.md](../AGENTS.md)
