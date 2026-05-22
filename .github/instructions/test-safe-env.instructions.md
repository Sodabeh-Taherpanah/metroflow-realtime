---
applyTo:
  - 'frontend/app/**/*.{ts,tsx}'
  - 'frontend/components/**/*.{ts,tsx}'
  - 'frontend/core/**/*.{ts,tsx}'
  - 'frontend/providers/**/*.{ts,tsx}'
  - 'frontend/utils/**/*.{ts,tsx}'
description: 'Keep shared frontend runtime modules safe for Jest by avoiding direct import.meta.env access.'
---

When a frontend runtime module may be imported by Jest, do not read `import.meta.env` directly.

Use a test-safe config wrapper or a constant fallback instead, so the module works in both the app runtime and Jest without requiring ESM/Jest alignment changes.
