# WattWeiser Platform - Datenschutz

## DSGVO-Compliance

Die WattWeiser-Plattform ist vollständig DSGVO-konform entwickelt.

## Datenkategorien

### Personenbezogene Daten
- **E-Mail-Adressen**: Für Authentifizierung
- **Namen**: Optional, für Personalisierung
- **IP-Adressen**: Für Audit-Logs (anonymisiert nach 90 Tagen)

### Technische Daten
- **Session-Tokens**: Für Authentifizierung
- **Usage-Metriken**: Token-Verbrauch, Kosten
- **Audit-Logs**: Aktionen der Nutzer

### Inhaltsdaten
- **Dokumente**: Hochgeladene Dokumente der Kunden
- **Chat-Historie**: Konversationen mit KI-Agenten
- **Agent-Runs**: Ausführungen von Agenten

## Datenverarbeitung

### Zweck
- **Plattform-Betrieb**: Bereitstellung der KI-Services
- **Verbesserung**: Analyse von Usage-Metriken (anonymisiert)
- **Compliance**: Audit-Logs für Compliance-Anforderungen

### Rechtsgrundlage
- **Vertragserfüllung**: Bereitstellung der Services
- **Einwilligung**: Optional für erweiterte Features
- **Berechtigtes Interesse**: Sicherheit, Betrugsprävention

### Datenweitergabe
- **Keine Weitergabe**: Daten werden nicht an Dritte weitergegeben
- **Sub-Processor**: Nur mit AVV (z.B. Cloud-Provider)
- **EU/EWR**: Alle Daten bleiben in EU/EWR

## Betroffenenrechte

### Auskunftsrecht (Art. 15 DSGVO)
- Nutzer können Auskunft über gespeicherte Daten erhalten
- API-Endpoint: `GET /api/admin/data-export`

### Löschrecht (Art. 17 DSGVO)
- Nutzer können Löschung ihrer Daten beantragen
- API-Endpoint: `DELETE /api/admin/data-deletion`

### Widerspruchsrecht (Art. 21 DSGVO)
- Nutzer können der Datenverarbeitung widersprechen
- API-Endpoint: `POST /api/admin/data-opt-out`

### Datenübertragbarkeit (Art. 20 DSGVO)
- Nutzer können ihre Daten exportieren
- Format: JSON, strukturiert

## Datenretention

### Chat-Historie
- **Standard**: 90 Tage
- **Konfigurierbar**: Pro Mandant

### Audit-Logs
- **Standard**: 90 Tage
- **Gesetzlich erforderlich**: Länger bei Bedarf

### Dokumente
- **Bis zur Löschung**: Durch Nutzer
- **Automatisch**: Nach Mandant-Kündigung (30 Tage)

## PII-Redaction

### Optional
- **Aktivierbar**: Pro Wissensraum
- **Methoden**: Named Entity Recognition, Regex-Patterns
- **Automatisch**: Bei Document-Ingestion

## Kontakt

### Datenschutzbeauftragter
- **E-Mail**: privacy@wattweiser.de
- **Adresse**: [Adresse einfügen]


