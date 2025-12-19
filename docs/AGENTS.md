# Agent-Konfiguration

## Verfügbare Agent-Rollen

### IT-Support Assist
- **ID**: `it-support-assist`
- **Beschreibung**: Hilft bei IT-Fragen, Problemen und Support-Anfragen
- **Tools**: HTTP Request, Jira, Slack, Retrieval
- **KPIs**: First Contact Resolution, Average Resolution Time

### Sales-Backoffice Assist
- **ID**: `sales-backoffice-assist`
- **Beschreibung**: Unterstützt im Vertrieb
- **Tools**: HTTP Request, Email, Retrieval, Jira
- **KPIs**: Lead Qualification Rate, Quote Acceptance Rate

### Meeting-Assist
- **ID**: `meeting-assist`
- **Beschreibung**: Unterstützt bei Meetings
- **Tools**: HTTP Request, Email, Retrieval
- **KPIs**: Meeting Efficiency, Action Item Completion

### Marketing-Assist
- **ID**: `marketing-assist`
- **Beschreibung**: Unterstützt im Marketing
- **Tools**: HTTP Request, Email, Retrieval, Slack
- **KPIs**: Content Quality, Engagement Rate

### Legal-Assist
- **ID**: `legal-assist`
- **Beschreibung**: Unterstützt in Rechtsfragen
- **Tools**: HTTP Request, Retrieval, Email
- **KPIs**: Document Review Accuracy, Compliance Rate

## Agent konfigurieren

```typescript
import { getRoleDefinition } from '@wattweiser/agents';

const role = getRoleDefinition('it-support-assist');
// Verwenden Sie die Rolle zur Agent-Erstellung
```

## Custom Agent erstellen

```typescript
import { BaseAgent, AgentConfig } from '@wattweiser/agents';

const config: AgentConfig = {
  agent: {
    name: 'Custom Agent',
    roleType: 'custom',
    description: 'Custom agent description',
  },
  persona: {
    name: 'Custom Persona',
    instructions: 'Agent instructions...',
    tone: 'professional',
  },
  tools: ['http_request', 'retrieval'],
  policies: {
    piiRedaction: true,
    maxCostPerRun: 0.50,
  },
};

const agent = new BaseAgent(config);
```

## Human-in-the-Loop (HiTL)

Agents können Genehmigungen für bestimmte Aktionen anfordern:

```typescript
// In Agent-Service
if (requiresApproval) {
  const approval = await hitlService.requestApproval(
    runId,
    toolCallId,
    'critical_action',
    context,
  );
  // Agent pausiert bis Genehmigung erhalten
}
```

## KPIs tracken

```typescript
import { KPITracker } from '@wattweiser/evaluations';

const tracker = new KPITracker();
tracker.addAgentResult(evaluationResult);
const kpis = tracker.calculateKPIs();
```
