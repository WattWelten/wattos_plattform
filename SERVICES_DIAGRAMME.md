# ðŸ¢ WattOS Plattform - Autarke Services Visualisierung

Die WattOS Plattform besteht aus modularen Services, von denen viele **autark als eigenstÃ¤ndige Produkte** funktionieren kÃ¶nnen. Die folgende Visualisierung zeigt die Autarkie-Level und Dependencies:

## ðŸ“Š Service-Autarkie Ãœbersicht

```mermaid
graph TB
    subgraph "ðŸŸ¢ VollstÃ¤ndig Autark (100%)"
        RAG[RAG Service<br/>WattSearch/WattRAG]
        SUMMARY[Summary Service<br/>WattSummarize]
        DASHBOARD[Dashboard Service<br/>WattDash/WattAnalytics]
        FEEDBACK[Feedback Service<br/>WattFeedback]
        OBS[Observability Service<br/>WattMonitor]
        LLM[LLM Gateway<br/>WattLLM Gateway]
        F13[F13 Service<br/>WattF13 Compliance]
        CRAWLER[Crawler Service<br/>WattCrawler]
    end
    
    subgraph "ðŸŸ¡ Teilweise Autark (60-80%)"
        CHAT[Chat Service<br/>WattChat<br/>70% autark]
        ADMIN[Admin Service<br/>WattAdmin<br/>80% autark]
        AVATAR[Avatar Service<br/>WattAvatar<br/>60% autark]
        VOICE[Voice Service<br/>WattVoice<br/>60% autark]
    end
    
    subgraph "ðŸ”´ AbhÃ¤ngig (10-30%)"
        AGENT[Agent Service<br/>30% autark]
        TOOL[Tool Service<br/>20% autark]
        CHAR[Character Service<br/>20% autark]
        CI[Customer Intelligence<br/>10% autark]
    end
    
    style RAG fill:#90EE90
    style SUMMARY fill:#90EE90
    style DASHBOARD fill:#90EE90
    style FEEDBACK fill:#90EE90
    style OBS fill:#90EE90
    style LLM fill:#90EE90
    style F13 fill:#90EE90
    style CRAWLER fill:#90EE90
    
    style CHAT fill:#FFD700
    style ADMIN fill:#FFD700
    style AVATAR fill:#FFD700
    style VOICE fill:#FFD700
    
    style AGENT fill:#FF6B6B
    style TOOL fill:#FF6B6B
    style CHAR fill:#FF6B6B
    style CI fill:#FF6B6B
```

## ðŸ”— Dependencies-Diagramm

Die autarken Services benÃ¶tigen nur Infrastructure-Komponenten (PostgreSQL, Redis, externe APIs):

```mermaid
graph LR
    subgraph "Infrastructure"
        PG[(PostgreSQL<br/>+ pgvector)]
        REDIS[(Redis)]
        LLM_API[LLM APIs<br/>OpenAI/Anthropic]
        F13_API[F13 API]
    end
    
    subgraph "ðŸŸ¢ Autarke Services"
        RAG[RAG Service]
        SUMMARY[Summary Service]
        DASHBOARD[Dashboard Service]
        FEEDBACK[Feedback Service]
        OBS[Observability Service]
        LLM_GW[LLM Gateway]
        F13_SVC[F13 Service]
        CRAWLER[Crawler Service]
    end
    
    RAG --> PG
    RAG -.-> REDIS
    SUMMARY --> LLM_GW
    DASHBOARD --> PG
    FEEDBACK --> PG
    OBS --> PG
    OBS -.-> REDIS
    LLM_GW --> PG
    LLM_GW --> REDIS
    LLM_GW --> LLM_API
    F13_SVC --> PG
    F13_SVC --> F13_API
    CRAWLER --> PG
    CRAWLER --> REDIS
    
    style RAG fill:#90EE90
    style SUMMARY fill:#90EE90
    style DASHBOARD fill:#90EE90
    style FEEDBACK fill:#90EE90
    style OBS fill:#90EE90
    style LLM_GW fill:#90EE90
    style F13_SVC fill:#90EE90
    style CRAWLER fill:#90EE90
```

## ðŸ”„ Service-AbhÃ¤ngigkeiten

Dieses Diagramm zeigt, welche Services voneinander abhÃ¤ngen und welche vollstÃ¤ndig unabhÃ¤ngig sind:

```mermaid
graph TD
    subgraph "ðŸŸ¢ Autarke Services"
        RAG[RAG Service]
        SUMMARY[Summary Service]
        DASHBOARD[Dashboard Service]
        FEEDBACK[Feedback Service]
        OBS[Observability Service]
        LLM_GW[LLM Gateway]
        F13_SVC[F13 Service]
        CRAWLER[Crawler Service]
    end
    
    subgraph "ðŸŸ¡ Teilweise Autark"
        CHAT[Chat Service]
        ADMIN[Admin Service]
        AVATAR[Avatar Service]
        VOICE[Voice Service]
    end
    
    subgraph "ðŸ”´ AbhÃ¤ngige Services"
        AGENT[Agent Service]
        TOOL[Tool Service]
        CHAR[Character Service]
        CI[Customer Intelligence]
    end
    
    CHAT -.->|optional| AGENT
    AGENT --> RAG
    AGENT --> TOOL
    AGENT --> LLM_GW
    CHAR --> AGENT
    CHAR --> AVATAR
    CI --> RAG
    CI --> SUMMARY
    CI --> DASHBOARD
    
    style RAG fill:#90EE90
    style SUMMARY fill:#90EE90
    style DASHBOARD fill:#90EE90
    style FEEDBACK fill:#90EE90
    style OBS fill:#90EE90
    style LLM_GW fill:#90EE90
    style F13_SVC fill:#90EE90
    style CRAWLER fill:#90EE90
    
    style CHAT fill:#FFD700
    style ADMIN fill:#FFD700
    style AVATAR fill:#FFD700
    style VOICE fill:#FFD700
    
    style AGENT fill:#FF6B6B
    style TOOL fill:#FF6B6B
    style CHAR fill:#FF6B6B
    style CI fill:#FF6B6B
```

## ðŸ“¦ Produkt-Pakete

Die folgenden Service-Kombinationen kÃ¶nnen als Produkt-Pakete verkauft werden:

```mermaid
graph TB
    subgraph "ðŸ“¦ Paket 1: WattSearch Suite"
        P1_RAG[RAG Service]
        P1_SUMMARY[Summary Service]
        P1_CRAWLER[Crawler Service]
        P1_RAG --> P1_SUMMARY
        P1_CRAWLER --> P1_RAG
    end
    
    subgraph "ðŸ“¦ Paket 2: WattAnalytics Platform"
        P2_DASH[Dashboard Service]
        P2_OBS[Observability Service]
        P2_FB[Feedback Service]
        P2_OBS --> P2_DASH
        P2_FB --> P2_DASH
    end
    
    subgraph "ðŸ“¦ Paket 3: WattAI Gateway"
        P3_LLM[LLM Gateway]
        P3_SUMMARY[Summary Service]
        P3_SUMMARY --> P3_LLM
    end
    
    style P1_RAG fill:#90EE90
    style P1_SUMMARY fill:#90EE90
    style P1_CRAWLER fill:#90EE90
    style P2_DASH fill:#90EE90
    style P2_OBS fill:#90EE90
    style P2_FB fill:#90EE90
    style P3_LLM fill:#90EE90
    style P3_SUMMARY fill:#90EE90
```

## ðŸš€ Service-Deployment-Strategie

Entscheidungsbaum fÃ¼r die Deployment-Strategie basierend auf dem Autarkie-Level:

```mermaid
flowchart TD
    START[Service Deployment] --> CHECK{Service<br/>Autarkie?}
    
    CHECK -->|100% Autark| STANDALONE[Standalone Deployment<br/>Eigenes Produkt]
    CHECK -->|60-80% Autark| ADAPT[Anpassungen erforderlich<br/>Optional Dependencies]
    CHECK -->|10-30% Autark| PLATFORM[Plattform-Integration<br/>Nur als Teil der Plattform]
    
    STANDALONE --> PACKAGE{Produkt-Paket?}
    PACKAGE -->|Ja| SUITE[WattSearch Suite<br/>WattAnalytics<br/>WattAI Gateway]
    PACKAGE -->|Nein| SINGLE[Einzelprodukt<br/>z.B. WattRAG]
    
    ADAPT --> MINIMAL[Minimale Anpassungen<br/>z.B. Frontend optional]
    
    PLATFORM --> INTEGRATED[Integriert bleiben<br/>Kein Standalone]
    
    style STANDALONE fill:#90EE90
    style ADAPT fill:#FFD700
    style PLATFORM fill:#FF6B6B
    style SUITE fill:#87CEEB
    style SINGLE fill:#87CEEB
```

## ðŸ“Š Autarkie-Matrix

| Service                    | Autarkie | Dependencies          | Produkt-Potenzial |
|----------------------------|----------|-----------------------|-------------------|
| RAG Service               | ðŸŸ¢ 100%  | PostgreSQL (pgvector) | â­â­â­â­â­         |
| Summary Service           | ðŸŸ¢ 100%  | LLM Gateway          | â­â­â­â­â­         |
| Dashboard Service         | ðŸŸ¢ 100%  | PostgreSQL            | â­â­â­â­â­         |
| Feedback Service          | ðŸŸ¢ 100%  | PostgreSQL            | â­â­â­â­           |
| Observability Service     | ðŸŸ¢ 100%  | PostgreSQL, Redis    | â­â­â­â­           |
| LLM Gateway               | ðŸŸ¢ 100%  | PostgreSQL, Redis    | â­â­â­â­â­         |
| F13 Service               | ðŸŸ¢ 100%  | PostgreSQL, F13 API  | â­â­â­â­           |
| Crawler Service           | ðŸŸ¢ 100%  | PostgreSQL, Redis    | â­â­â­â­           |
| Chat Service              | ðŸŸ¡ 70%   | Agent Service (opt)  | â­â­â­             |
| Admin Service             | ðŸŸ¡ 80%   | PostgreSQL            | â­â­â­             |
| Avatar Service            | ðŸŸ¡ 60%   | Frontend (opt)        | â­â­â­             |
| Voice Service             | ðŸŸ¡ 60%   | Frontend (opt)        | â­â­â­             |
| Agent Service             | ðŸ”´ 30%   | RAG, Tool, LLM        | â­                 |
| Tool Service              | ðŸ”´ 20%   | Agent Service         | â­                 |
| Character Service         | ðŸ”´ 20%   | Agent, Avatar         | â­                 |
| Customer Intelligence     | ðŸ”´ 10%   | Multiple Services     | â­                 |

## ðŸ’¡ Produkt-Pakete Details

### ðŸ“¦ Paket 1: "WattSearch Suite"
- **RAG Service** - Vector Search & Retrieval
- **Summary Service** - Content Summarization
- **Crawler Service** - Web Crawling & Content Extraction
- **Use Case:** Enterprise Search & Knowledge Management

### ðŸ“¦ Paket 2: "WattAnalytics Platform"
- **Dashboard Service** - Business Intelligence Dashboards
- **Observability Service** - Application Monitoring
- **Feedback Service** - Customer Feedback Collection
- **Use Case:** Business Intelligence & Monitoring

### ðŸ“¦ Paket 3: "WattAI Gateway"
- **LLM Gateway** - Multi-Provider LLM Access
- **Summary Service** - Content Processing
- **Use Case:** LLM API Management & Content Processing

---

**Stand:** 2025-01-27 | **Phase:** 6 (Testing)

**Hinweis:** Diese Diagramme werden in Markdown-Viewern mit Mermaid-Support gerendert (z.B. GitHub, GitLab, VS Code mit Mermaid Extension, Obsidian, etc.)
