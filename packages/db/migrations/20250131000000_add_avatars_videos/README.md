# Migration: Avatar & Video Models

Diese Migration fügt die `Avatar` und `Video` Models zur Datenbank hinzu.

## Manuelle Ausführung

Da Prisma 7 eine andere Konfiguration verwendet, kann die Migration manuell ausgeführt werden:

```sql
-- Migration-Datei: migration.sql
-- Führe die SQL-Datei direkt in PostgreSQL aus:
psql -U wattos -d wattos_plattform -f migration.sql
```

Oder über Docker:

```bash
docker exec -i wattos-postgres psql -U wattos -d wattos_plattform < migration.sql
```

## Prisma Client generieren

Nach der Migration muss der Prisma Client neu generiert werden:

```bash
cd packages/db
npx prisma generate
```

## Verifizierung

Prüfe ob die Tabellen erstellt wurden:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('Avatar', 'Video');
```
