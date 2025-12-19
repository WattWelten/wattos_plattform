# TypeScript Strict Mode Dokumentation

## Übersicht

Die WattOS KI Plattform verwendet TypeScript mit **strict mode** aktiviert, um maximale Type-Safety zu gewährleisten.

## Aktuelle Konfiguration

### Base TypeScript Config (`packages/config/tsconfig.base.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "strictNullChecks": true,
    "noImplicitAny": true
  }
}
```

### Aktivierte Strict Options

#### `strict: true`

Aktiviert alle strict Type-Checking-Optionen:

- `noImplicitAny`
- `strictNullChecks`
- `strictFunctionTypes`
- `strictBindCallApply`
- `strictPropertyInitialization`
- `noImplicitThis`
- `alwaysStrict`

#### `noUnusedLocals: true`

Fehler bei ungenutzten lokalen Variablen:

```typescript
// ❌ Fehler
function example() {
  const unused = 5; // Error: 'unused' is declared but never used
  return true;
}

// ✅ Korrekt
function example() {
  const used = 5;
  return used;
}

// ✅ Oder mit _ Prefix (ignoriert)
function example() {
  const _unused = 5; // OK
  return true;
}
```

#### `noUnusedParameters: true`

Fehler bei ungenutzten Parametern:

```typescript
// ❌ Fehler
function example(param: string) {
  return true; // Error: 'param' is declared but never used
}

// ✅ Korrekt
function example(param: string) {
  console.log(param);
  return true;
}

// ✅ Oder mit _ Prefix (ignoriert)
function example(_param: string) {
  return true; // OK
}
```

#### `noImplicitReturns: true`

Fehler bei fehlenden Return-Statements:

```typescript
// ❌ Fehler
function example(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  // Error: Function lacks ending return statement
}

// ✅ Korrekt
function example(condition: boolean): string {
  if (condition) {
    return 'yes';
  }
  return 'no';
}
```

#### `noFallthroughCasesInSwitch: true`

Fehler bei Switch Fallthrough:

```typescript
// ❌ Fehler
switch (value) {
  case 1:
    doSomething();
    // Error: Fallthrough case in switch
  case 2:
    doSomethingElse();
    break;
}

// ✅ Korrekt
switch (value) {
  case 1:
    doSomething();
    break; // Oder return
  case 2:
    doSomethingElse();
    break;
}
```

#### `strictNullChecks: true`

Strict Null-Checks:

```typescript
// ❌ Fehler
function example(value: string) {
  return value.length; // Error: 'value' is possibly 'null' or 'undefined'
}

// ✅ Korrekt
function example(value: string | null) {
  if (value === null) {
    return 0;
  }
  return value.length;
}

// ✅ Oder mit Non-Null Assertion (sparsam verwenden)
function example(value: string | null) {
  return value!.length; // Nur wenn sicher, dass value nicht null ist
}
```

#### `noImplicitAny: true`

Fehler bei impliziten `any` Types:

```typescript
// ❌ Fehler
function example(param) { // Error: Parameter 'param' implicitly has an 'any' type
  return param;
}

// ✅ Korrekt
function example(param: string) {
  return param;
}
```

## Service-spezifische Konfigurationen

Alle Services erben von der Base-Konfiguration:

```json
{
  "extends": "@wattweiser/config/tsconfig.base.json",
  "compilerOptions": {
    // Service-spezifische Overrides
  }
}
```

### Gateway (`apps/gateway/tsconfig.json`)

- Erbt alle strict Options
- Zusätzlich: `strictNullChecks: true` (explizit)
- Zusätzlich: `noImplicitAny: true` (explizit)

### Services

Alle Services in `apps/services/*` verwenden die Base-Konfiguration mit möglichen Service-spezifischen Anpassungen.

## Migration zu Strict Mode

### Häufige Probleme

#### 1. Null/Undefined Checks

```typescript
// Vorher
function getUser(id: string) {
  return users.find(u => u.id === id);
}

// Nachher (mit strictNullChecks)
function getUser(id: string): User | undefined {
  return users.find(u => u.id === id);
}
```

#### 2. Implizite Any

```typescript
// Vorher
function process(data) {
  return data.value;
}

// Nachher
function process(data: { value: string }) {
  return data.value;
}
```

#### 3. Unused Variables

```typescript
// Vorher
function example() {
  const unused = 5;
  return true;
}

// Nachher
function example() {
  return true;
}

// Oder wenn benötigt für zukünftige Verwendung
function example() {
  const _unused = 5; // Mit _ Prefix
  return true;
}
```

## Best Practices

### 1. Explizite Return Types

```typescript
// ✅ Gut: Expliziter Return Type
function getUser(id: string): User | undefined {
  // ...
}

// ⚠️ OK: Type Inference (wenn klar)
function add(a: number, b: number) {
  return a + b; // Type: number
}
```

### 2. Null Checks

```typescript
// ✅ Gut: Explizite Null Checks
function processUser(user: User | null): string {
  if (user === null) {
    return 'No user';
  }
  return user.name;
}

// ✅ Gut: Optional Chaining
function processUser(user: User | null): string {
  return user?.name ?? 'No user';
}
```

### 3. Type Guards

```typescript
// ✅ Gut: Type Guards
function isUser(value: unknown): value is User {
  return typeof value === 'object' && value !== null && 'name' in value;
}

function process(value: unknown) {
  if (isUser(value)) {
    // value ist jetzt User
    return value.name;
  }
}
```

### 4. Non-Null Assertions (sparsam)

```typescript
// ⚠️ Nur wenn absolut sicher
function example(value: string | null) {
  // Nur wenn sicher, dass value nicht null ist
  return value!.length;
}

// ✅ Besser: Explizite Checks
function example(value: string | null) {
  if (value === null) {
    throw new Error('Value cannot be null');
  }
  return value.length;
}
```

## Type Coverage

### Ziel

- **Type Coverage:** >95%
- **Wird überwacht:** In CI/CD Pipeline

### Messung

```bash
# Type Coverage messen (mit tool wie type-coverage)
npx type-coverage
```

## Troubleshooting

### Type Errors beheben

1. **Null/Undefined Errors:**
   - Explizite Null-Checks hinzufügen
   - Optional Chaining verwenden
   - Non-Null Assertions (sparsam)

2. **Implicit Any Errors:**
   - Explizite Types hinzufügen
   - Type Inference nutzen wo möglich

3. **Unused Variables:**
   - Entfernen wenn nicht benötigt
   - `_` Prefix wenn für zukünftige Verwendung

### Strict Mode temporär deaktivieren

**⚠️ Nicht empfohlen!** Nur in Ausnahmefällen:

```json
{
  "compilerOptions": {
    "strict": false,
    "noImplicitAny": false
  }
}
```

**Besser:** Schrittweise Migration mit expliziten Overrides.

## Weiterführende Dokumentation

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript Handbook - Strict Mode](https://www.typescriptlang.org/docs/handbook/2/strict-mode.html)
- [TypeScript Compiler Options](https://www.typescriptlang.org/tsconfig)












