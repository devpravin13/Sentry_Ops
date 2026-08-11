# Sentry_Ops

**Unified health monitoring for the full stack — network, application, database, and server layers — with proactive, cross-layer alerting before downtime occurs.**

Built with **ASP.NET Core (.NET 8)** backend and a **React + TypeScript** dashboard, deployed on **Azure** with hybrid support for on-premises infrastructure via **VPN/AVD**.

---

## Overview

Infrastructure issues are often discovered *reactively* — after downtime has already happened — because monitoring across server, database, application, and network layers traditionally lives in siloed, disconnected tools.

**Sentry_Ops** brings all four layers into a single pane of glass. It polls hybrid components (Azure and on-prem), evaluates metrics against configurable thresholds, correlates anomalies across layers to surface root causes, and dispatches targeted email alerts to the right engineering team aliases before outages strike.

## Features (v1)

- **4-Layer Monitoring** — CPU, memory, disk, DB query latency, connection pool, request rate, error rate, response time, packet loss, network latency, and bandwidth.
- **Hybrid Environment Support** — Azure cloud resources and on-premises components connected securely via VPN/AVD tunnels.
- **Threshold-Based Alerting** — Configurable per-component warning and critical thresholds with duration conditions.
- **Cross-Layer Correlation** — Centralized engine evaluates time-windowed anomalies across layers to identify probable root causes.
- **Targeted Email Notifications** — Pluggable SMTP routing to team aliases with full alert lifecycle tracking (Firing → Acknowledged → Resolved).
- **Operations Dashboard** — Real-time centralized status views with graceful reconnect for live metric streams.

### Out of Scope (v1)

- ML-based anomaly detection / predictive analytics
- Mobile applications
- Multi-tenant support
- High-availability clustering for Sentry_Ops itself

See [`_bmad-output/planning-artifacts/prds/prd-Sentry_Ops-2026-08-10/prd.md`](_bmad-output/planning-artifacts/prds/prd-Sentry_Ops-2026-08-10/prd.md) for full requirements.

---

## Architecture

Sentry_Ops follows a **modular clean architecture** — a backend monolith (ASP.NET Core, .NET 8) organized by domain modules, communicating with a decoupled React SPA via REST and SignalR.

Key decisions:

| Decision | Details |
|----------|---------|
| **AD-1** | Backend modules communicate via in-process domain events, not cross-module DB queries. |
| **AD-2** | All hybrid metric collection (SSH/WMI/SNMP/SQL probes) traverses encrypted VPN/AVD tunnels. |
| **AD-3** | Unified time-series/relational schema in Azure SQL with centralized correlation engine. |
| **AD-4** | Frontend handles connection drops gracefully with auto-reconnect to SignalR streams. |

See [`_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md`](_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md) for the full architecture spine.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core (.NET 8) |
| Frontend | React + TypeScript + Tailwind CSS |
| Database | Azure SQL Database |
| Infrastructure | Azure App Service / Azure Container Apps |
| IaC | Bicep / Terraform |
| Email | Pluggable SMTP |
| Logging | Serilog (structured JSON) |

---

## Getting Started

> **Status:** Development environment is not yet scaffolded. The project uses the
> [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) for planning and
> development. Planning artifacts (PRD, architecture, epics) are available below.

### Prerequisites

- .NET 8 SDK
- Node.js (LTS)
- Azure CLI
- Access to an Azure subscription with hybrid VPN/AVD connectivity

### Setup

1. **Install the BMAD framework** (needed to work with planning artifacts, not committed to repo):
   ```bash
   npx bmad-method install
   ```
   Select `BMad Core Module` and `BMad Method` when prompted.

2. **Sync planning artifacts** — read these before picking up any work:
   - [`_bmad-output/planning-artifacts/product-brief-sentry-ops.md`](_bmad-output/planning-artifacts/product-brief-sentry-ops.md)
   - [`_bmad-output/planning-artifacts/prds/prd-Sentry_Ops-2026-08-10/prd.md`](_bmad-output/planning-artifacts/prds/prd-Sentry_Ops-2026-08-10/prd.md)
   - [`_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md`](_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md)

3. **Infrastructure provisioning** & **dependency installation** steps will be documented here once the tech stack is finalized.

---

## Planning & Development

This project is organized with **BMAD** (Breakthrough Method for Agile AI-Driven Development). All planning artifacts live in `_bmad-output/`:

```
_bmad-output/
└── planning-artifacts/
    ├── product-brief-sentry-ops.md
    ├── epics.md
    ├── prds/
    │   └── prd-Sentry_Ops-2026-08-10/
    │       └── prd.md
    └── architecture/
        └── ARCHITECTURE-SPINE.md
```

The `_bmad/` framework directory is **gitignored** — regenerate it locally via `npx bmad-method install`.

---

## Contributing

Contributions are welcome! Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the fork → clone → branch → PR workflow, branching conventions, and code review process.

## License

Internal use — see repository for license details.
