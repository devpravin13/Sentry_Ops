# Product Brief: Sentry_Ops

## 1. Executive Summary & Problem Statement
Teams typically discover infrastructure issues (network, application, database, server) reactively — after downtime has already occurred — because monitoring for each layer lives in separate, disconnected tools. **Sentry_Ops** aims to unify health monitoring across all four layers into one single pane of glass, featuring proactive alerting that catches problems before they cause outages.

## 2. Target Users & Scope Context
- **Primary Users:** Internal engineering and operations teams responsible for keeping infrastructure and applications healthy.
- **Initial Context:** Deployed for internal team / OBI context (not for external commercial use in v1).

## 3. Core Capabilities & v1 Scope (All 4 Layers)
- **v1 Core Scope:** 
  - **Comprehensive 4-Layer Monitoring:** Server (CPU %, Memory %, Disk Space %), Database (Query Latency, Connection Pool), Application (Request Rate, Error Rate, Response Time), and Network (Packet Loss, Latency, Bandwidth).
  - **Hybrid Environment Support:** Monitoring both on-premises components via VPN/AVD and Azure cloud resources.
  - **Threshold-Based Alerting & Correlation:** Configurable per component with sensible defaults, plus cross-layer correlation rules (e.g., "DB latency spike + high server CPU = probable cause X").
  - **Notifications & Lifecycle Management:** In-tool + Targeted email notifications via pluggable SMTP routing to team aliases, with alert state tracking (firing, acknowledged, resolved).
  - **Operations Dashboard:** Centralized real-time status views across all four layers.

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
A working v1 that can monitor components across all four layers (Server, Database, Application, Network) in hybrid environments and reliably fire a targeted notification before a threshold breach.
