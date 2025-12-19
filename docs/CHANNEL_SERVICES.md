# Channel-Services Dokumentation

## Übersicht

Die Channel-Services implementieren verschiedene Kommunikationskanäle für WattOS V2. Alle Channels folgen einem einheitlichen Interface und werden über den Channel-Router verwaltet.

## Architektur

### Channel-Interface

Alle Channels implementieren das `IChannel` Interface:

```typescript
interface IChannel {
  readonly name: string;
  readonly type: ChannelType; // 'text' | 'voice' | 'multimodal'
  
  sendMessage(sessionId: string, message: ChannelMessage): Promise<ChannelResponse>;
  receiveMessage(sessionId: string, message: ChannelMessage): Promise<void>;
  createSession(config: ChannelSessionConfig): Promise<ChannelSession>;
  closeSession(sessionId: string): Promise<void>;
  // ... weitere Methoden
}
```

### Channel-Router

Der `ChannelRouterService` bietet eine einheitliche API für alle Channels:

- Session-Management über Channels
- Cross-Channel Session-Wechsel
- Event-basierte Kommunikation
- Cross-Channel Analytics

## Implementierte Channels

### 1. Web-Chat Service

**Port**: 3017  
**Type**: Multimodal  
**Features**:
- WebSocket für Echtzeit-Kommunikation
- SSE für Streaming
- Avatar-Integration (optional)
- Text & Voice Support

**Endpunkte**:
- `POST /api/v1/web-chat/sessions` - Session erstellen
- `WS /api/v1/web-chat/sessions/:id` - WebSocket-Verbindung
- `POST /api/v1/web-chat/sessions/:id/messages` - Nachricht senden
- `SSE /api/v1/web-chat/sessions/:id/stream` - Streaming

### 2. Phone-Bot Service

**Port**: 3018  
**Type**: Voice  
**Features**:
- Twilio Voice API Integration
- STT → Orchestrator → TTS
- Barge-in Support
- DTMF-Support
- Call-Recording (optional)

**Endpunkte**:
- `POST /api/v1/phone-bot/webhook/incoming` - Incoming Call Webhook
- `POST /api/v1/phone-bot/webhook/gather/:callSid` - Speech/DTMF Input
- `POST /api/v1/phone-bot/webhook/status` - Call Status Webhook
- `GET /api/v1/phone-bot/sessions/:id` - Session abrufen
- `POST /api/v1/phone-bot/sessions/:id/hangup` - Call beenden

**Umgebungsvariablen**:
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Twilio Phone Number

### 3. WhatsApp-Bot Service

**Port**: 3019  
**Type**: Text  
**Features**:
- Meta WhatsApp Business API Integration
- Text-Nachrichten
- Media-Nachrichten (Bilder, Videos, Dokumente)
- Template-Messages
- Interactive Messages (Buttons, Lists)
- Webhook-basiert

**Endpunkte**:
- `GET /api/v1/whatsapp-bot/webhook` - Webhook-Verifizierung
- `POST /api/v1/whatsapp-bot/webhook` - Webhook für eingehende Nachrichten
- `POST /api/v1/whatsapp-bot/sessions` - Session erstellen
- `GET /api/v1/whatsapp-bot/sessions/:id` - Session abrufen
- `POST /api/v1/whatsapp-bot/sessions/:id/messages` - Nachricht senden
- `POST /api/v1/whatsapp-bot/sessions/:id/templates` - Template senden
- `POST /api/v1/whatsapp-bot/sessions/:id/interactive` - Interactive Message senden

**Umgebungsvariablen**:
- `META_WHATSAPP_PHONE_NUMBER_ID` - Meta Phone Number ID
- `META_WHATSAPP_ACCESS_TOKEN` - Meta Access Token
- `META_WHATSAPP_VERIFY_TOKEN` - Webhook Verify Token

## Session-Management

### Session-Lifecycle

1. **Erstellen**: `createSession()` - Erstellt neue Session
2. **Aktiv**: Session ist aktiv, Nachrichten können gesendet/empfangen werden
3. **Pausiert**: `pauseSession()` - Session pausiert, keine neuen Nachrichten
4. **Fortsetzen**: `resumeSession()` - Session wird wieder aktiv
5. **Schließen**: `closeSession()` - Session wird geschlossen

### Cross-Channel Sessions

Sessions können zwischen Channels gewechselt werden:

```typescript
// Web-Chat → WhatsApp
const newSession = await channelRouter.switchChannel(
  sessionId,
  'web-chat',
  'whatsapp'
);
```

## Event-Integration

Alle Channel-Aktionen emittieren Events:

- `channel.message.received` - Nachricht empfangen
- `channel.message.sent` - Nachricht gesendet
- `channel.session.created` - Session erstellt
- `channel.session.closed` - Session geschlossen
- `channel.session.paused` - Session pausiert

## Integration mit Orchestrator

Channels kommunizieren über Events mit dem Orchestrator:

```
Channel → Channel Event → Event Bus → Orchestrator → Agent Events → Channel Response
```

## Best Practices

### 1. Error-Handling

Alle Channel-Implementierungen sollten robustes Error-Handling haben:

```typescript
try {
  await channel.sendMessage(sessionId, message);
} catch (error) {
  logger.error(`Failed to send message: ${error.message}`);
  // Fallback oder Retry-Logik
}
```

### 2. Session-Validierung

Immer Session-Status prüfen:

```typescript
const session = await channel.getSession(sessionId);
if (!session || session.status !== 'active') {
  throw new Error('Session not active');
}
```

### 3. Event-Emission

Alle Channel-Aktionen sollten Events emittieren:

```typescript
await eventBus.emit({
  type: 'channel.message.sent',
  domain: EventDomain.CHANNEL,
  // ...
});
```

## Weiterführende Dokumentation

- [Core Platform Dokumentation](./WATTOS_V2_CORE_PLATFORM.md)
- [Channel-Interface](../packages/core/src/channels/interfaces/channel.interface.ts)
- [Channel-Router](../packages/core/src/channels/channel-router.service.ts)

