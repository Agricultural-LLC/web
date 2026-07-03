# cms

## Overview

Source module `src/lib/cms`.

## Notes

- CMS writes should preserve existing Firebase data shape unless a schema migration is explicitly requested.
- Validate IDs and user-provided content before writing to Firebase.
- Keep admin/operator labels aligned with the current public brand, but do not rewrite historical database values without a migration plan.

## Related

- Parent: [src/lib/AGENTS.md](../AGENTS.md)
