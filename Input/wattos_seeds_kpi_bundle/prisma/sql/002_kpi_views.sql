CREATE OR REPLACE VIEW vw_kpi_answered AS
  SELECT i."tenantId" AS tenant_id, date_trunc('day', a."createdAt") AS d, count(*) AS answered
  FROM "Answer" a JOIN "Interaction" i ON i.id=a."interactionId"
  GROUP BY 1,2;
CREATE OR REPLACE VIEW vw_kpi_self_service AS
  SELECT i."tenantId" AS tenant_id, date_trunc('day', a."createdAt") AS d,
    avg(CASE WHEN a.solved THEN 1.0 ELSE 0.0 END) AS self_service_rate
  FROM "Answer" a JOIN "Interaction" i ON i.id=a."interactionId"
  GROUP BY 1,2;
CREATE OR REPLACE VIEW vw_kpi_p95_latency AS
  SELECT i."tenantId" AS tenant_id, date_trunc('day', a."createdAt") AS d,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY a."latencyMs") AS p95_latency
  FROM "Answer" a JOIN "Interaction" i ON i.id=a."interactionId"
  GROUP BY 1,2;
CREATE OR REPLACE VIEW vw_kpi_csat AS
  SELECT tenantId AS tenant_id, date_trunc('day', "createdAt") AS d,
    round(avg(CASE
      WHEN type IN ('STAR5','UP') THEN 5
      WHEN type='STAR4' THEN 4
      WHEN type='STAR3' THEN 3
      WHEN type='STAR2' THEN 2
      WHEN type IN ('STAR1','DOWN') THEN 1
    END)::numeric,2) AS csat
  FROM "Feedback"
  GROUP BY 1,2;
