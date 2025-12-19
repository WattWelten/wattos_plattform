# Code Quality Standards

Dieses Dokument beschreibt die Code-Qualitäts-Standards für die WattOS KI Plattform.

## Übersicht

Die Plattform verwendet mehrere Tools und Konfigurationen, um eine hohe Code-Qualität sicherzustellen:

- **ESLint** - Linting und Code-Qualitäts-Checks
- **Prettier** - Automatische Code-Formatierung
- **TypeScript** - Type-Safety
- **Husky** - Git Hooks für Pre-Commit-Validierung
- **Commitlint** - Conventional Commits Validierung

## Pre-Commit Hooks

### Aktivierte Checks

Vor jedem Commit werden automatisch folgende Checks durchgeführt:

1. **ESLint** (mit Auto-Fix)
   - Linting-Fehler werden automatisch behoben, wenn möglich
   - Nicht behebbare Fehler blockieren den Commit

2. **Prettier** (Auto-Format)
   - Code wird automatisch formatiert
   - Konsistente Formatierung über das gesamte Projekt

3. **TypeScript Type-Check**
   - Alle Type-Fehler müssen behoben sein
   - Type-Safety wird durchgesetzt

4. **TODO/FIXME Warnung** (nicht blockierend)
   - Warnung bei TODO/FIXME Kommentaren
   - Erinnert Entwickler, diese zu adressieren

5. **console.log Warnung** (nicht blockierend)
   - Warnung bei console.log Statements
   - Empfehlung, Logger zu verwenden

### Commit Message Validierung

Commit-Messages müssen dem [Conventional Commits](https://www.conventionalcommits.org/) Standard folgen:

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Erlaubte Types:**
- `feat`: Neue Feature
- `fix`: Bugfix
- `docs`: Dokumentation
- `style`: Formatierung (keine Code-Änderung)
- `refactor`: Refactoring
- `perf`: Performance-Verbesserung
- `test`: Tests
- `build`: Build-System
- `ci`: CI/CD
- `chore`: Andere Änderungen

**Beispiele:**
```
feat(chat): add streaming support
fix(rag): correct vector search query
docs: update deployment guide
refactor(gateway): simplify proxy logic
```

**Breaking Changes:**
```
feat(api)!: change authentication method

BREAKING CHANGE: JWT tokens now require additional claims
```

## ESLint Regeln

### Aktivierte Regeln

#### Code-Qualität
- **complexity**: Max. Zyklomatische Komplexität von 15
- **max-lines**: Max. 500 Zeilen pro Datei (ohne Leerzeilen/Kommentare)
- **max-lines-per-function**: Max. 100 Zeilen pro Funktion
- **consistent-return**: Immer Return-Statement

#### Import Order
- Automatische Sortierung von Imports
- Gruppierung: builtin → external → internal → parent → sibling → index
- Alphabetische Sortierung innerhalb jeder Gruppe

#### Magic Numbers
- Warnung bei Magic Numbers (außer: -1, 0, 1, 2, 10, 100, 1000)
- Array-Indizes und Default-Werte sind erlaubt

#### Unused Code
- Unused Variables blockieren Commit
- Variables mit `_` Prefix werden ignoriert

#### Console
- `console.log` ist nicht erlaubt (Warnung)
- `console.warn` und `console.error` sind erlaubt

### Deaktivierte Regeln

- `@typescript-eslint/explicit-function-return-type`: Off (zu restriktiv)
- `@typescript-eslint/explicit-module-boundary-types`: Off (zu restriktiv)
- `@typescript-eslint/no-explicit-any`: Warn (nicht blockierend)

## TypeScript Konfiguration

### Strict Mode

Die TypeScript-Konfiguration verwendet **strict mode** mit folgenden Optionen:

- `strict: true` - Aktiviert alle strict Checks
- `noUnusedLocals: true` - Unused lokale Variablen
- `noUnusedParameters: true` - Unused Parameter
- `noImplicitReturns: true` - Immer Return-Statement
- `noFallthroughCasesInSwitch: true` - Switch Fallthrough
- `strictNullChecks: true` - Strict Null Checks
- `noImplicitAny: true` - Keine impliziten `any` Types

### Type Coverage Ziel

- **Ziel:** >95% Type Coverage
- **Aktuell:** Wird überwacht in CI/CD

## Code-Formatierung

### Prettier Konfiguration

Prettier wird für konsistente Code-Formatierung verwendet:

- Automatische Formatierung bei jedem Commit
- Konsistente Einrückung, Zeilenumbrüche, etc.

### Manuelle Formatierung

```bash
pnpm format
```

## Qualitäts-Metriken

### Code Coverage

- **Ziel:** >80% Code Coverage
- **Aktuell:** Wird überwacht in CI/CD

### Type Coverage

- **Ziel:** >95% Type Coverage
- **Aktuell:** Wird überwacht in CI/CD

### Complexity

- **Ziel:** Durchschnittliche Komplexität <10
- **Max:** 15 pro Funktion

## Best Practices

### 1. Imports

```typescript
// ✅ Gut: Sortiert und gruppiert
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@wattweiser/db';
import { Logger } from '@wattweiser/shared';

// ❌ Schlecht: Unsortiert
import { Logger } from '@wattweiser/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@wattweiser/db';
```

### 2. Magic Numbers

```typescript
// ✅ Gut: Named Constants
const MAX_RETRIES = 3;
const TIMEOUT_MS = 5000;

if (retries < MAX_RETRIES) {
  // ...
}

// ❌ Schlecht: Magic Numbers
if (retries < 3) {
  // ...
}
```

### 3. Console Usage

```typescript
// ✅ Gut: Logger verwenden
import { Logger } from '@nestjs/common';

private readonly logger = new Logger(MyService.name);

this.logger.log('Service started');
this.logger.error('Error occurred', error);

// ❌ Schlecht: console.log
console.log('Service started');
```

### 4. Function Complexity

```typescript
// ✅ Gut: Einfache Funktionen
function validateUser(user: User): boolean {
  if (!user.email) return false;
  if (!user.name) return false;
  return true;
}

// ❌ Schlecht: Zu komplex
function validateUser(user: User): boolean {
  // 50+ Zeilen Logik
  // Viele verschachtelte if-Statements
  // ...
}
```

### 5. Return Statements

```typescript
// ✅ Gut: Konsistentes Return
function getStatus(): string {
  if (condition) {
    return 'active';
  }
  return 'inactive';
}

// ❌ Schlecht: Fehlendes Return
function getStatus(): string {
  if (condition) {
    return 'active';
  }
  // Fehlendes Return
}
```

## Automatische Fixes

### ESLint Auto-Fix

```bash
pnpm lint --fix
```

### Prettier Format

```bash
pnpm format
```

## CI/CD Integration

Alle Code-Qualitäts-Checks werden auch in CI/CD durchgeführt:

- **Linting:** Bei jedem Push
- **Type-Check:** Bei jedem Push
- **Tests:** Bei jedem Push
- **Coverage:** Bei jedem Push

## Troubleshooting

### Pre-Commit Hook schlägt fehl

1. **ESLint Fehler:**
   ```bash
   pnpm lint --fix
   ```

2. **TypeScript Fehler:**
   ```bash
   pnpm type-check
   ```

3. **Prettier Formatierung:**
   ```bash
   pnpm format
   ```

### Commit Message wird abgelehnt

Stelle sicher, dass die Commit-Message dem Conventional Commits Format folgt:

```
feat: add new feature
fix: fix bug
docs: update documentation
```

### Hook umgehen (nicht empfohlen)

```bash
git commit --no-verify
```

**⚠️ Warnung:** Nur in Notfällen verwenden. Code-Qualität sollte immer gewährleistet sein.

## Weiterführende Dokumentation

- [ESLint Dokumentation](https://eslint.org/docs/latest/)
- [Prettier Dokumentation](https://prettier.io/docs/en/)
- [TypeScript Dokumentation](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Husky Dokumentation](https://typicode.github.io/husky/)












