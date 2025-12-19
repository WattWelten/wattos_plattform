# Runbook: Database Issues

## Symptome

- Database Connection Errors
- Slow Queries
- Connection Pool Exhaustion
- Migration Failures
- Data Corruption

## Diagnose

### 1. Prüfe Database Connectivity

```bash
# Prüfe Connection String
echo $DATABASE_URL

# Test Connection
psql $DATABASE_URL -c "SELECT 1;"
```

### 2. Prüfe Connection Pool

```bash
# Prüfe aktive Connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Prüfe max_connections
psql $DATABASE_URL -c "SHOW max_connections;"
```

### 3. Prüfe Slow Queries

```bash
# Prüfe aktive Queries
psql $DATABASE_URL -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"
```

### 4. Prüfe Database Size

```bash
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"
```

## Mögliche Ursachen

1. **Connection Pool Exhaustion** - Zu viele Connections
2. **Slow Queries** - Ineffiziente Queries
3. **Missing Indexes** - Fehlende Indizes
4. **Database Full** - Kein Speicherplatz
5. **Network Issues** - Netzwerkprobleme
6. **Migration Failure** - Fehlerhafte Migration

## Lösung

### Schritt 1: Prüfe Connection Pool

```bash
# Prüfe aktive Connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Kill idle Connections falls nötig
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND pid <> pg_backend_pid();"
```

### Schritt 2: Prüfe Slow Queries

```bash
# Finde langsame Queries
psql $DATABASE_URL -c "SELECT pid, now() - query_start AS duration, query FROM pg_stat_activity WHERE state = 'active' ORDER BY duration DESC LIMIT 10;"

# Kill sehr langsame Queries (>5 Minuten)
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE now() - query_start > interval '5 minutes' AND state = 'active';"
```

### Schritt 3: Prüfe Indexes

```bash
# Prüfe fehlende Indexes
psql $DATABASE_URL -c "SELECT schemaname, tablename, attname, n_distinct, correlation FROM pg_stats WHERE n_distinct > 100 ORDER BY n_distinct DESC;"
```

### Schritt 4: Database Maintenance

```bash
# VACUUM
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# REINDEX
psql $DATABASE_URL -c "REINDEX DATABASE current_database();"
```

### Schritt 5: Migration Rollback (falls nötig)

```bash
# Prüfe Migration Status
./scripts/migrate.sh status production

# Rollback falls nötig
# (Manuell via Prisma Migrate)
```

## Prävention

1. **Connection Pool Monitoring** - Max Connections überwachen
2. **Query Performance** - Slow Query Alerts
3. **Index Optimization** - Regelmäßige Index-Analyse
4. **Database Backups** - Tägliche Backups
5. **Migration Testing** - Migrations in Staging testen

## Post-Mortem

1. Dokumentiere Root Cause
2. Erstelle GitHub Issue
3. Update Runbook
4. Implementiere Monitoring












