# Security Audit Report

**Datum**: 2025-12-20T16:13:32.470Z
**Befehl**: `pnpm audit`

## ❌ Status: Audit fehlgeschlagen

```
┌─────────────────────┬────────────────────────────────────────────────────────┐
│ moderate            │ esbuild enables any website to send any requests to    │
│                     │ the development server and read the response           │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Package             │ esbuild                                                │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Vulnerable versions │ <=0.24.2                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Patched versions    │ >=0.25.0                                               │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ Paths               │ . > vitest@2.1.9 > @vitest/mocker@2.1.9 > vite@5.4.21  │
│                     │ > esbuild@0.21.5                                       │
│                     │                                                        │
│                     │ . > vitest@2.1.9 > vite@5.4.21 > esbuild@0.21.5        │
│                     │                                                        │
│                     │ . > vitest@2.1.9 > vite-node@2.1.9 > vite@5.4.21 >     │
│                     │ esbuild@0.21.5                                         │
│                     │                                                        │
│                     │ ... Found 33 paths, run `pnpm why esbuild` for more    │
│                     │ information                                            │
├─────────────────────┼────────────────────────────────────────────────────────┤
│ More info           │ https://github.com/advisories/GHSA-67mh-4wv8-2f99      │
└─────────────────────┴────────────────────────────────────────────────────────┘
1 vulnerabilities found
Severity: 1 moderate

```
