# WattWeiser Platform - Evaluation

## Evaluations-Harness

### Testset-Generator
- Synthetische Testfälle pro Agenten-Rolle
- 10 Beispiel-Testfälle pro Rolle
- Realistische Szenarien basierend auf Use Cases

### Metriken

#### Halluzinations-Checks
- **Quellenabdeckung**: Anteil der Antworten mit Quellenangaben
- **Faktengenauigkeit**: Vergleich mit Ground Truth
- **Red-Team-Prompts**: Test auf problematische Antworten

#### Performance-Metriken
- **Latency**: Antwortzeit (P50, P95, P99)
- **Token-Verbrauch**: Pro Request
- **Kosten**: USD pro Request

#### Qualitäts-Metriken
- **Relevanz**: Score der Suchergebnisse
- **Kohärenz**: Konsistenz der Antworten
- **Vollständigkeit**: Abdeckung der Frage

## Prompt-Versionierung

### Versionierung
- **Semantic Versioning**: Major.Minor.Patch
- **Git-basiert**: Jede Version in Git
- **A/B-Testing**: Vergleich von Versionen

### Testsets pro Rolle

#### IT-Support Assist
1. "Wie resetten ich mein Passwort?"
2. "Mein Drucker funktioniert nicht"
3. "Wie verbinde ich mich mit dem VPN?"
4. "Ich habe einen Fehler beim Login"
5. "Wie installiere ich Software X?"
6. "Mein Monitor zeigt nichts an"
7. "Wie ändere ich meine E-Mail-Adresse?"
8. "Ich kann nicht auf Datei Y zugreifen"
9. "Wie erstelle ich ein Backup?"
10. "Mein Computer ist langsam"

#### Sales-Assistenz
1. "Erstelle ein Angebot für Kunde X"
2. "Was sind die Preise für Produkt Y?"
3. "Wann ist die nächste Lieferung?"
4. "Erstelle eine Rechnung"
5. "Wie ist der Status von Bestellung Z?"
6. "Welche Rabatte gibt es?"
7. "Erstelle eine Kundenpräsentation"
8. "Wie lautet die AGB?"
9. "Was sind die Zahlungsbedingungen?"
10. "Erstelle ein Follow-up für Kunde X"

## KPI-Tracking

### Agenten-KPIs
- **FCR-Rate**: First-Contact-Resolution
- **Zeitersparnis**: Vergleich mit manueller Bearbeitung
- **Lead-Time**: Zeit bis zur Lösung
- **Eskalationsquote**: Anteil der Eskalationen
- **Zufriedenheit**: User-Ratings

### System-KPIs
- **Token/Cost**: Pro Mandant, pro Provider
- **Latency**: P95 Response-Time
- **Availability**: Uptime
- **Error-Rate**: Fehlerquote

## Automatisierte Evals

### Ragas/TruLens-kompatibel
- **Framework**: Kompatibel mit Ragas und TruLens
- **Metriken**: Faithfulness, Answer Relevancy, Context Precision
- **Integration**: Automatische Ausführung nach Deployments

### Continuous Evaluation
- **Scheduled**: Täglich/Wöchentlich
- **On-Demand**: Manuell auslösbar
- **Reporting**: Automatische Reports


