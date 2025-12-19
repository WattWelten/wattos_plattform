# LLM-Gateway Dokumentation

## Übersicht

Der LLM-Gateway ist der zentrale Service für alle LLM-Aufrufe in der WattWeiser Plattform. Er bietet:

- **Multi-Provider Support**: OpenAI, Azure OpenAI, Anthropic, Google, Ollama
- **Automatisches Fallback**: Bei Ausfall eines Providers wird automatisch auf einen anderen gewechselt
- **Cost-Tracking**: Automatische Kostenverfolgung und Persistierung in der Datenbank
- **Provider Health Monitoring**: Überwachung der Provider-Verfügbarkeit

## Cost-Tracking

### Automatische Persistierung

Jeder LLM-Aufruf wird automatisch in der `LLMUsage` Tabelle gespeichert:

```typescript
{
  tenantId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd: Decimal;
  createdAt: DateTime;
}
```

### Kostenberechnung

Die Kosten werden basierend auf Modell-spezifischen Raten berechnet:

- **GPT-4**: $0.03/1K prompt, $0.06/1K completion
- **GPT-4 Turbo**: $0.01/1K prompt, $0.03/1K completion
- **GPT-4o**: $0.005/1K prompt, $0.015/1K completion
- **Claude 3 Opus**: $0.015/1K prompt, $0.075/1K completion
- **Claude 3 Sonnet**: $0.003/1K prompt, $0.015/1K completion
- **Claude 3 Haiku**: $0.00025/1K prompt, $0.00125/1K completion
- **Gemini Pro**: $0.0005/1K prompt, $0.0015/1K completion

### Kosten abrufen

```typescript
const costTrackingService = new CostTrackingService();
const costs = await costTrackingService.getCostsForTenant(
  tenantId,
  startDate, // optional
  endDate    // optional
);

// Returns:
{
  totalCost: number;
  totalTokens: number;
  usageCount: number;
  usage: LLMUsage[];
}
```

## API-Endpunkte

### Chat Completion

```http
POST /v1/chat/completions
Content-Type: application/json

{
  "model": "gpt-4",
  "provider": "openai", // optional
  "messages": [...],
  "tenantId": "tenant_123" // optional, für Cost-Tracking
}
```

### Completion (Legacy)

```http
POST /v1/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "prompt": "...",
  "tenantId": "tenant_123"
}
```

## Provider-Fallback

Bei Ausfall eines Providers wird automatisch auf den nächsten Provider in der Prioritätsliste gewechselt:

1. OpenAI
2. Azure OpenAI
3. Anthropic
4. Google
5. Ollama

## Fehlerbehandlung

- **DB-Fehler**: Brechen den LLM-Aufruf nicht ab, werden nur geloggt
- **Provider-Fehler**: Automatisches Fallback auf nächsten Provider
- **Rate-Limiting**: Retry mit Exponential Backoff

## Monitoring

Der Service loggt alle Kosten automatisch:

```
Cost | tenant=tenant_123 provider=openai model=gpt-4 cost=$0.000150
```

Diese Logs können für Analytics und Monitoring verwendet werden.














