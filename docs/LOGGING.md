# Logging Best Practices

## StructuredLoggerService

Verwende den \StructuredLoggerService\ aus \@wattweiser/shared\ fÃ¼r alle Backend-Services.

\\\	ypescript
import { StructuredLoggerService } from '@wattweiser/shared';

@Injectable()
export class MyService {
  private readonly logger = new StructuredLoggerService().setContext('MyService');

  async doSomething() {
    this.logger.log('Operation started', { userId: '123' });
    this.logger.error('Operation failed', error.stack, 'MyService');
    this.logger.warn('Deprecated method called', { method: 'oldMethod' });
    this.logger.debug('Debug information', { data: someData });
  }
}
\\\

## Log-Levels

- **error:** Kritische Fehler, die Aufmerksamkeit erfordern
- **warn:** Warnungen, potenzielle Probleme
- **info:** Allgemeine Informationen, wichtige Events
- **debug:** Detaillierte Debug-Informationen
- **verbose/trace:** Sehr detaillierte Informationen

## Strukturiertes Logging

Verwende Metadaten fÃ¼r strukturiertes Logging:

\\\	ypescript
this.logger.logWithMetadata('info', 'User created', {
  userId: user.id,
  email: user.email,
  tenantId: tenant.id,
});
\\\

## Performance-Logging

\\\	ypescript
const startTime = Date.now();
// ... operation ...
this.logger.logPerformance('database-query', Date.now() - startTime, {
  query: 'SELECT * FROM users',
  rows: result.length,
});
\\\

## Request-Logging

\\\	ypescript
this.logger.logRequest('GET', '/api/users', 200, duration, {
  userId: request.user?.id,
  ip: request.ip,
});
\\\

## Request-ID Tracking

Request-IDs werden automatisch aus AsyncLocalStorage hinzugefÃ¼gt, wenn verfÃ¼gbar.

## Best Practices

1. **Verwende immer StructuredLoggerService** statt console.log/error
2. **Setze Context** fÃ¼r bessere Traceability
3. **Verwende Metadaten** fÃ¼r strukturiertes Logging
4. **Log-Level anpassen** je nach Umgebung (Development: debug, Production: info)
5. **Keine sensiblen Daten** in Logs (Passwords, Tokens, etc.)

## Frontend-Logging

Im Frontend ist \console.error\ fÃ¼r Error-Handling akzeptabel, aber verwende strukturiertes Logging wo mÃ¶glich.
