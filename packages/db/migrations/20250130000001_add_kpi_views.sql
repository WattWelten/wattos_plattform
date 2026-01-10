-- KPI Views für Performance-Optimierung
-- Diese Views aggregieren KPI-Daten für schnelle Abfragen

-- ============================================
-- VIEW: vw_kpi_answered
-- Anzahl beantworteter Anfragen pro Tenant und Tag
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_answered AS
SELECT 
  i."tenantId" AS tenant_id,
  date_trunc('day', a."createdAt") AS d,
  count(*) AS answered
FROM "ConversationMessage" a
JOIN "Conversation" i ON i.id = a."conversationId"
WHERE a.role = 'assistant' -- Nur Assistant-Antworten
GROUP BY 1, 2;

-- ============================================
-- VIEW: vw_kpi_self_service
-- Self-Service-Quote (gelöste Anfragen / Gesamt)
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_self_service AS
SELECT 
  i."tenantId" AS tenant_id,
  date_trunc('day', a."createdAt") AS d,
  avg(CASE WHEN a.solved THEN 1.0 ELSE 0.0 END) AS self_service_rate,
  count(*) AS total_answers,
  sum(CASE WHEN a.solved THEN 1 ELSE 0 END) AS solved_count
FROM "ConversationMessage" a
JOIN "Conversation" i ON i.id = a."conversationId"
WHERE a.role = 'assistant'
GROUP BY 1, 2;

-- ============================================
-- VIEW: vw_kpi_p95_latency
-- P95 Latenz pro Tenant und Tag
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_p95_latency AS
SELECT 
  i."tenantId" AS tenant_id,
  date_trunc('day', a."createdAt") AS d,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs") AS p95_latency,
  avg(a."latencyMs") AS avg_latency,
  min(a."latencyMs") AS min_latency,
  max(a."latencyMs") AS max_latency
FROM "ConversationMessage" a
JOIN "Conversation" i ON i.id = a."conversationId"
WHERE a.role = 'assistant' AND a."latencyMs" IS NOT NULL
GROUP BY 1, 2;

-- ============================================
-- VIEW: vw_kpi_csat
-- Customer Satisfaction Score (1-5) pro Tenant und Tag
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_csat AS
SELECT 
  "tenantId" AS tenant_id,
  date_trunc('day', "createdAt") AS d,
  round(avg(CASE
    WHEN type IN ('STAR5', 'UP') THEN 5
    WHEN type = 'STAR4' THEN 4
    WHEN type = 'STAR3' THEN 3
    WHEN type = 'STAR2' THEN 2
    WHEN type IN ('STAR1', 'DOWN') THEN 1
    ELSE NULL
  END)::numeric, 2) AS csat,
  count(*) AS feedback_count
FROM "Feedback"
WHERE type IS NOT NULL
GROUP BY 1, 2;

-- ============================================
-- VIEW: vw_kpi_after_hours
-- Anteil Anfragen außerhalb Öffnungszeiten
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_after_hours AS
SELECT 
  i."tenantId" AS tenant_id,
  date_trunc('day', m."createdAt") AS d,
  -- Wochenende (Samstag=6, Sonntag=0)
  sum(CASE 
    WHEN EXTRACT(ISODOW FROM m."createdAt") IN (6, 0) THEN 1
    ELSE 0
  END) AS weekend_count,
  -- Außerhalb 8-18 Uhr (wird später mit Tenant-Config verfeinert)
  sum(CASE 
    WHEN EXTRACT(ISODOW FROM m."createdAt") NOT IN (6, 0)
      AND (EXTRACT(HOUR FROM m."createdAt")::int < 8 OR EXTRACT(HOUR FROM m."createdAt")::int >= 18)
    THEN 1
    ELSE 0
  END) AS after_hours_count,
  count(*) AS total_queries
FROM "ConversationMessage" m
JOIN "Conversation" i ON i.id = m."conversationId"
WHERE m.role = 'user' -- Nur User-Fragen
GROUP BY 1, 2;

-- ============================================
-- VIEW: vw_kpi_top_topics
-- Top-N Themen pro Tenant (vereinfacht über Event-Payload)
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_top_topics AS
SELECT 
  "tenantId" AS tenant_id,
  date_trunc('day', ts) AS d,
  payloadJsonb->>'topic' AS topic,
  count(*) AS count
FROM "Event"
WHERE type = 'chat.asked' 
  AND payloadJsonb->>'topic' IS NOT NULL
GROUP BY 1, 2, 3;

-- ============================================
-- VIEW: vw_kpi_time_saved
-- Zeitersparnis und FTE-Ersparnis (benötigt Tenant-Config für avgHandleTimeMin)
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_time_saved AS
SELECT 
  i."tenantId" AS tenant_id,
  date_trunc('day', a."createdAt") AS d,
  sum(CASE WHEN a.solved THEN 1 ELSE 0 END) AS self_service_count,
  -- avgHandleTimeMin wird aus Tenant.settings geladen (nicht in View)
  -- Zeitersparnis = self_service_count * avgHandleTimeMin / 60 (Stunden)
  -- FTE-Ersparnis = time_saved_h / 160
  NULL::numeric AS time_saved_h, -- Wird in Service berechnet
  NULL::numeric AS fte_saved     -- Wird in Service berechnet
FROM "ConversationMessage" a
JOIN "Conversation" i ON i.id = a."conversationId"
WHERE a.role = 'assistant'
GROUP BY 1, 2;

-- ============================================
-- VIEW: vw_kpi_coverage
-- Abdeckungsgrad: Anteil Top-N-Themen mit quality>=good
-- ============================================

CREATE OR REPLACE VIEW vw_kpi_coverage AS
SELECT 
  e."tenantId" AS tenant_id,
  date_trunc('day', e.ts) AS d,
  e.payloadJsonb->>'topic' AS topic,
  -- Quality: Feedback >=4* oder solved=true
  avg(CASE 
    WHEN f.type IN ('STAR4', 'STAR5', 'UP') THEN 1
    WHEN a.solved = true THEN 1
    ELSE 0
  END) AS quality_score,
  count(*) AS topic_count
FROM "Event" e
LEFT JOIN "ConversationMessage" a ON a.id::text = e.payloadJsonb->>'queryId'
LEFT JOIN "Feedback" f ON f."queryId" = a.id
WHERE e.type = 'chat.asked'
  AND e.payloadJsonb->>'topic' IS NOT NULL
GROUP BY 1, 2, 3;

-- ============================================
-- INDEXES für Performance (falls noch nicht vorhanden)
-- ============================================

-- Index für ConversationMessage role + solved
CREATE INDEX IF NOT EXISTS "ConversationMessage_role_solved_idx" 
  ON "ConversationMessage"("role", "solved") 
  WHERE "role" = 'assistant';

-- Index für Feedback type
CREATE INDEX IF NOT EXISTS "Feedback_type_idx" 
  ON "Feedback"("type");

-- Index für Event type + ts (bereits vorhanden, aber sicherstellen)
CREATE INDEX IF NOT EXISTS "Event_type_ts_idx" 
  ON "Event"("type", "ts" DESC);
