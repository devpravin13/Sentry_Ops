# Architecture Spine: Sentry_Ops (Complete 4-Layer Architecture)

## 1. Inherited Invariants & Paradigm
- **Design Paradigm:** Modular Clean Architecture in ASP.NET Core (.NET 8) with a decoupled React + TypeScript Single Page Application. Separation of concerns between Ingestion, Evaluation, Storage, and Presentation layers.
- **Inherited Constraints:** Hybrid deployment supporting both Azure cloud infrastructure and on-premises environments connected via secure VPN/AVD tunnels. Pluggable SMTP for email notifications. Standard Azure SQL resilience without complex high-availability clusters in v1.

## 2. Architectural Decisions (ADs)

### AD-1: Backend Modular Monolith (.NET 8 ASP.NET Core)
- **Binds:** All backend services (Ingestion Poller, Threshold Evaluator, Notification Dispatcher, API) into a single, cohesive .NET 8 solution organized by domain modules.
- **Prevents:** Distributed system overhead and network latency between internal modules while retaining clean interface boundaries for future service extraction.
- **Rule:** Modules must communicate via in-process domain events/interfaces rather than direct cross-module database queries.

### AD-2: Hybrid Ingestion Strategy (Pull-Based Polling & Secure Tunneling)
- **Binds:** Hybrid metric collection over secure VPN/AVD tunnels using authenticated polling (SSH/WMI/SNMP/SQL probes) and secure agent push endpoints.
- **Prevents:** Direct exposure of internal target ports to the public internet.
- **Rule:** All external/on-prem communication must traverse encrypted channels with certificate or token-based authentication.

### AD-3: Unified Multi-Layer Data Model & Correlation Engine
- **Binds:** Storage of metrics across Server, Database, Application, and Network layers in a unified time-series/relational schema within Azure SQL, processed by a centralized correlation engine.
- **Prevents:** Siloed data stores for different monitoring layers.
- **Rule:** Cross-layer correlation rules evaluate time-windowed metric anomalies to identify root causes (e.g., Network latency + DB query delay + Server CPU).

### AD-4: Decoupled SPA Frontend (React + TypeScript + Tailwind)
- **Binds:** React SPA communicating exclusively with the backend via RESTful APIs and SignalR for real-time alert/metric streaming.
- **Prevents:** Tight coupling between server-side rendering and business logic.
- **Rule:** Frontend state management must handle connection drops gracefully with automatic reconnection for real-time WebSocket/SignalR feeds.

## 3. System Topology & Data Flow (Mermaid)

```mermaid
graph TD
    subgraph On-Premise Environment [On-Premise (via VPN/AVD)]
        OP_Server[Servers / VMs]
        OP_DB[(Databases)]
        OP_Net[Network Nodes]
    end

    subgraph Azure Cloud [Azure Cloud Infrastructure]
        LB[Load Balancer]
        API[ASP.NET Core API / Ingestion Engine]
        DB[(Azure SQL Database)]
        SMTP[Pluggable SMTP Server]
    end

    subgraph Client [Engineering Operations]
        SPA[React SPA Dashboard]
    end

    OP_Server -->|Secure Polling / Push| LB
    OP_DB -->|Query Latency Probes| LB
    OP_Net -->|SNMP / Ping Probes| LB
    
    LB --> API
    API --> DB
    API -->|Threshold Breach| SMTP
    SMTP -->|Email Alert| Eng[Engineering Team Alias]

    SPA -->|REST / SignalR Real-time| API
```

## 4. Operational & Environmental Envelope
- **Deployment & Environments:** Containerized workloads deployed on Azure App Service / Azure Container Apps with Azure SQL Database. Infrastructure provisioned via Infrastructure-as-Code (Bicep/Terraform).
- **Backup & Recovery:** Daily automated Azure SQL database backups and automated IaC redeployment scripts. No complex multi-region high availability required for v1.
- **Observability & Runbooks:** Built-in health check endpoints (`/health`) for Sentry_Ops itself, structured JSON logging via Serilog, and operational runbooks for alert tuning and SMTP reconnection.

## 5. Deferred & Out of Scope
- **Advanced Anomaly Detection (ML):** Deferred to post-v1; rule-based static and dynamic thresholds take precedence.
- **Multi-Tenant Support:** Single-tenant internal deployment (OBI context).
- **Mobile Native Apps:** Web responsive design is prioritized over dedicated mobile apps.
