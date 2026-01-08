# Error Handling Best Practices

## Standardisierte Exception-Klassen

Verwende die standardisierten Exception-Klassen aus \@wattweiser/shared\:

\\\	ypescript
import { 
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
  ServiceUnavailableException
} from '@wattweiser/shared';

// Beispiel
throw new NotFoundException('User not found', 'USER_NOT_FOUND', { userId: '123' });
\\\

## Error Response Format

Alle Errors folgen diesem Format:

\\\json
{
  "statusCode": 404,
  "timestamp": "2026-01-06T12:00:00.000Z",
  "path": "/api/users/123",
  "method": "GET",
  "message": "User not found",
  "requestId": "req-1234567890-abc123",
  "code": "USER_NOT_FOUND",
  "details": {
    "userId": "123"
  }
}
\\\

## Request-ID Tracking

Request-IDs werden automatisch hinzugefÃ¼gt:
- Aus Header: \X-Request-ID\ oder \X-Correlation-ID\
- Oder automatisch generiert

## Best Practices

1. **Verwende spezifische Exceptions:** Nicht immer \InternalServerErrorException\
2. **FÃ¼ge Context hinzu:** Verwende \details\ fÃ¼r zusÃ¤tzliche Informationen
3. **Logging:** Errors werden automatisch geloggt mit Context
4. **Stack Traces:** Nur in Development-Mode sichtbar
