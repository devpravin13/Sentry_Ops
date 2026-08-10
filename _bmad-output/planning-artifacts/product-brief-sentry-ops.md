# Product Brief: Sentry_Ops

## 1. Executive Summary & Problem Statement
Teams typically discover infrastructure issues (network, application, database, server) reactively — after downtime has already occurred — because monitoring for each layer lives in separate, disconnected tools. **Sentry_Ops** aims to unify health monitoring across all four layers into one single pane of glass, featuring proactive alerting that catches problems before they cause outages.

## 2. Target Users & Scope Context
- **Primary Users:** Internal engineering and operations teams responsible for keeping infrastructure and applications healthy.
- **Initial Context:** Deployed for internal team / OBI context (not for external commercial use in v1).

## 3. Core Capabilities & Phased Roadmap
- **Phase 1 (v1):** 
  - Server & Database health monitoring (CPU %, Memory %, Disk Space %, DB connection / query response time).
  - Hybrid environment support (monitoring both on-premises components via VPN/AVD and Azure cloud resources).
  - Threshold-based alerting (configurable per component/server with sensible defaults).
  - In-tool + Targeted email notifications (routing alerts to specific team aliases/channels with basic alert state tracking: firing, acknowledged, resolved).
  - Basic dashboard and incident lifecycle management (detection → notification → acknowledgment → remediation).
- **Phase 2 (v2):** 
  - Application-layer instrumentation and alerting.
- **Phase 3 (v3):** 
  - Network-layer monitoring and cross-layer correlation (e.g., "DB latency spike + high server CPU = probable cause X").

### Rationale for Phasing
Server and database metrics are the most directly observable and possess the clearest signal-to-alert path, making them the fastest route to a working, demoable core loop. Application and network layers require more complex instrumentation and integration, and are therefore sequenced after the core monitoring pattern is proven.

## 4. Out of Scope for v1
- Advanced anomaly detection / ML-based prediction
- Mobile application
- Multi-tenant support
- High-availability clustering for Sentry_Ops itself / strict low-RTO targets (standard Azure SQL backups and automated IaC deployment are sufficient for v1).

## 5. Technical Stack & Architecture Preferences
- **Backend:** ASP.NET Core (.NET / C#)
- **Frontend:** React (TypeScript)
- **Cloud / Hosting:** Azure
- **Connectivity:** Secure VPN / AVD for hybrid on-prem-to-Azure monitoring.

## 6. Success Criteria
A working v1 that can monitor at least one real component per prioritized layer (server and database across hybrid environments) and reliably fire a targeted email notification before a simulated or real threshold breach.
