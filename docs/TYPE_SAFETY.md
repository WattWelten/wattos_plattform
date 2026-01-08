# Type Safety Best Practices

## Vermeide \ny\ Types

Verwende spezifische Types statt \ny\:

\\\	ypescript
// âŒ Schlecht
function process(data: any) {
  return data.value;
}

// âœ… Gut
function process(data: { value: string }) {
  return data.value;
}

// âœ… Oder mit generischen Types
function process<T extends { value: string }>(data: T): string {
  return data.value;
}
\\\

## Error Handling mit \unknown\

Verwende \unknown\ statt \ny\ fÃ¼r Error-Handling:

\\\	ypescript
// âŒ Schlecht
catch (error: any) {
  console.log(error.message);
}

// âœ… Gut
catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message);
  } else {
    console.log('Unknown error');
  }
}
\\\

## Type Guards

Verwende Type Guards fÃ¼r sichere Type-Checks:

\\\	ypescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: unknown) {
  if (isString(value)) {
    // TypeScript weiÃŸ hier, dass value ein string ist
    return value.toUpperCase();
  }
}
\\\

## Record Types statt \ny\

Verwende \Record<string, unknown>\ oder spezifische Types:

\\\	ypescript
// âŒ Schlecht
const data: any = {};

// âœ… Gut
const data: Record<string, unknown> = {};

// âœ… Noch besser: Spezifische Types
interface UserData {
  id: string;
  name: string;
  email: string;
}
const user: UserData = { id: '1', name: 'John', email: 'john@example.com' };
\\\

## Type Assertions vermeiden

Vermeide \s any\ oder \s unknown\ wo mÃ¶glich:

\\\	ypescript
// âŒ Schlecht
const value = data as any;

// âœ… Gut: Type Guard verwenden
if (isValidData(data)) {
  const value = data.value;
}
\\\

## Best Practices

1. **Strict Mode aktivieren:** \strict: true\ in tsconfig.json
2. **noImplicitAny:** Verhindert implizite \ny\ Types
3. **strictNullChecks:** Null/Undefined Checks
4. **noUnusedLocals/Parameters:** Unbenutzte Variablen finden
5. **Verwende Zod** fÃ¼r Runtime-Validierung und Type-Inferenz
