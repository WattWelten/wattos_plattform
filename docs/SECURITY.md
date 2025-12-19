# WattWeiser Platform - Sicherheit

## Technische Maßnahmen (TOMs)

### Verschlüsselung
- **TLS 1.3**: Alle externen Verbindungen
- **Datenbank-Verschlüsselung**: PostgreSQL mit verschlüsselten Verbindungen
- **Secrets-Management**: Railway Environment Variables, GitHub Secrets

### Access Control
- **RBAC**: Rollenbasierte Zugriffskontrolle
- **Mandantentrennung**: Streng getrennte Datenräume
- **MFA**: Multi-Faktor-Authentifizierung (optional)
- **SSO**: OIDC/SAML-Integration

### Audit & Logging
- **Audit-Logs**: Alle kritischen Aktionen werden geloggt
- **Strukturierte Logs**: JSON-Format für einfache Analyse
- **Retention**: 90 Tage (konfigurierbar)

### Rate Limiting
- **Pro User**: 100 Requests/Minute
- **Pro Tenant**: Konfigurierbar
- **Redis-basiert**: Verteiltes Rate-Limiting

## Organisatorische Maßnahmen

### Datenverarbeitung
- **Kein Training auf Kundendaten**: LLMs werden nicht mit Kundendaten trainiert
- **PII-Redaction**: Optional in Document-Pipeline
- **Datenminimierung**: Nur notwendige Daten werden gespeichert

### Hosting
- **EU/EWR-Option**: Railway EU-Region
- **Datenresidenz**: Konfigurierbar pro Mandant
- **Backup-Strategie**: Tägliche Backups

### AVV-Vorbereitung
- **Vertragsvorlagen**: AVV-ready
- **Datenkategorien**: Klassifizierung aller Daten
- **Löschkonzept**: Automatische Löschung nach Retention

## Incident Response

### Prozess
1. **Erkennung**: Monitoring-Alerts
2. **Eskalation**: Automatische Benachrichtigung
3. **Reaktion**: Incident-Response-Team
4. **Dokumentation**: Post-Mortem

### Kontakt
- **Security-Team**: security@wattweiser.de
- **Incident-Hotline**: [Nummer einfügen]

## Compliance

### DSGVO
- **Rechtmäßigkeit**: Vertragserfüllung, Einwilligung
- **Transparenz**: Datenschutzerklärung
- **Zweckbindung**: Klare Zweckbestimmung
- **Datenminimierung**: Nur notwendige Daten
- **Speicherbegrenzung**: Retention-Policy
- **Integrität und Vertraulichkeit**: Verschlüsselung, Access Control

### ISO 27001 (Ziel)
- **Information Security Management System**
- **Risikomanagement**
- **Kontinuierliche Verbesserung**


