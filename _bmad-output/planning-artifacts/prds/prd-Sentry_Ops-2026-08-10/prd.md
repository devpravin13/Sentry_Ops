---
title: Sentry_Ops
created: 2026-08-10
updated: 2026-08-10
status: draft
---

# PRD: Sentry_Ops

## 0. Document Purpose
This Product Requirements Document (PRD) defines the v1 functional requirements, architecture scope boundaries, and success criteria for **Sentry_Ops**, an internal unified health monitoring and proactive alerting platform. It serves PMs, stakeholders, and downstream technical architects/developers. It builds directly upon the foundational product brief and incorporates hybrid cloud connectivity, email notification routing, and resilience parameters.

## 1. Vision
Teams typically discover infrastructure issues (network, application, database, server) reactively — after downtime has already occurred — because monitoring for each layer lives in separate, disconnected tools. Sentry_Ops unifies health monitoring across server and database layers (with future expansion to application and network) into a single pane of glass, featuring proactive alerting that catches problems before outages occur. By consolidating key metrics and providing targeted notifications across hybrid environments (Azure cloud and on-premises via VPN/AVD), Sentry_Ops empowers engineering and operations teams to maintain high availability and swift incident response with minimal tool fatigue.

## 2. Target User

### 2.1 Jobs To Be Done
- As an internal infrastructure/ops engineer, I want to view server and database vitals in a single dashboard so that I don't have to jump across multiple disconnected tools.
- As an operator, I want to receive proactive email alerts when resource thresholds (CPU, memory, disk, query latency) are breached so that I can resolve issues before downtime happens.
- As a team lead, I want alerts routed to specific team email aliases/channels so that the right engineers are notified promptly.

### 2.2 Non-Users (v1)
- External commercial customers (v1 is scoped strictly for internal team / OBI use).
- Non-technical business stakeholders seeking complex executive analytics.

### 2.3 Key User Journeys

- **UJ-1. Alex checks hybrid cluster vitals during morning standup.**
  - **Persona + context:** Alex, an internal ops engineer, wants a quick pulse check on both Azure cloud VMs and on-prem servers.
  - **Entry state:** Authenticated to the Sentry_Ops web dashboard.
  - **Path:** Alex opens the dashboard, filters view by environment (Azure vs On-Prem via VPN/AVD), and reviews CPU, memory, and database response time gauges.
  - **Climax:** Alex instantly spots a database connection pool spike on an on-prem instance before any user reports failure.
  - **Resolution:** Alex acknowledges the warning state in-tool, preventing escalation.

- **UJ-2. The ops team receives an automated threshold breach alert.**
  - **Persona + context:** An on-prem database server experiences sustained high query latency.
  - **Entry state:** Background polling detects query latency > 500ms for 5 consecutive minutes.
  - **Path:** Sentry_Ops evaluates the threshold, creates an incident record, and dispatches an email notification to the configured team alias.
  - **Climax:** The operations team receives the targeted email alert containing component details and current metric values.
  - **Resolution:** Engineer opens Sentry_Ops, views the alert state transition from *Firing* to *Acknowledged*, and investigates the underlying cause.

## 3. Glossary
- **Component** — A monitorable infrastructure entity (e.g., Virtual Machine, Physical Server, SQL Database instance).
- **Metric** — A point-in-time numerical measurement of resource utilization or performance (e.g., CPU %, Memory %, Disk Space %, Query Latency).
- **Threshold** — A configurable numerical limit and duration condition that, when breached by a metric, triggers an alert state.
- **Alert State** — The lifecycle status of an alert: *Firing*, *Acknowledged*, or *Resolved*.
- **Notification Channel** — A configured email destination route for dispatching alerts to specific teams or aliases.

## 4. Features

### 4.1 Hybrid Infrastructure Monitoring Dashboard
**Description:** A centralized web interface displaying real-time and polled health metrics for server and database components deployed across Azure cloud and on-premises environments (connected via VPN/AVD). Realizes UJ-1.

**Functional Requirements:**

#### FR-1: Component Registration and Management
Administrators can register server and database components specifying their environment type (Azure vs On-Prem), endpoint/connection details, and polling interval. Realizes UJ-1.

**Consequences (testable):**
- System successfully stores component definitions in Azure SQL.
- System validates connection connectivity upon registration.

#### FR-2: Polling and Metric Ingestion
The backend polling engine periodically collects CPU %, Memory %, Disk Space %, and DB query latency metrics from registered components across hybrid boundaries. Realizes UJ-1.

**Consequences (testable):**
- Metrics are ingested at the configured interval (default 60 seconds).
- Failed polling attempts log an unreachable status without crashing the monitoring service.

### 4.2 Threshold-Based Proactive Alerting & Notifications
**Description:** Evaluates ingested metrics against configurable component thresholds and dispatches targeted email notifications when breaches occur. Realizes UJ-2.

**Functional Requirements:**

#### FR-3: Configurable Alert Thresholds
Users can define and update warning and critical thresholds per component (e.g., CPU > 85% for 5 mins). Realizes UJ-2.

**Consequences (testable):**
- Threshold rules are persisted and evaluated against every incoming metric batch.
- Alert transitions correctly from *Healthy* to *Firing* upon sustained breach.

#### FR-4: Targeted Email Notifications & State Tracking
The system dispatches formatted email alerts via pluggable SMTP configuration to designated team email aliases and tracks alert lifecycle states (*Firing*, *Acknowledged*, *Resolved*). Realizes UJ-2.

**Consequences (testable):**
- Email is successfully sent to the configured recipient alias upon alert creation.
- Users can update alert state (acknowledge/resolve) via the Sentry_Ops dashboard.

## 4.3 Cross-Cutting Non-Functional Requirements (NFRs)

#### NFR-1: Performance & Polling Latency
- **Metric Collection:** Polling execution for hybrid endpoints (Azure and on-prem via VPN/AVD) must complete within a 60-second polling window for up to 50 concurrent components.
- **UI Responsiveness:** Dashboard views and component health status updates must render within 2 seconds.

#### NFR-2: Reliability & Fault Tolerance
- **Polling Resilience:** A network timeout or failure when polling an individual on-prem or cloud component must log a warning status without crashing or blocking the background polling service loop.
- **Data Persistence:** Monitored metric history and alert state transitions must be durably stored in Azure SQL.

#### NFR-3: Security & Data Privacy
- **Transport Security:** All metric collection across hybrid boundaries (between Azure and on-premises targets) must occur over encrypted tunnels (VPN / AVD).
- **Credential Protection:** Database connection strings and SMTP credentials must be securely stored using encrypted configuration settings or environment variables.

#### NFR-4: Operability & Auditability
- **Alert State Tracking:** All alert state changes (*Firing* → *Acknowledged* → *Resolved*) must record timestamp and operator context for internal operational review.


## 5. Non-Goals (Explicit)
- Advanced ML-based anomaly detection or predictive failure analysis.
- Native mobile applications (iOS/Android).
- Multi-tenant data segregation.
- Complex high-availability clusters or strict sub-minute RTO targets for Sentry_Ops itself (standard Azure SQL backups and automated IaC deployment are sufficient).

## 6. MVP Scope

### 6.1 In Scope
- Server (CPU, Memory, Disk) and Database health monitoring.
- Hybrid environment monitoring (Azure + On-Prem via VPN/AVD).
- Threshold-based alerting with pluggable SMTP email notifications.
- Basic React dashboard with alert state tracking (Firing, Acknowledged, Resolved).
- Standard Azure SQL backup & IaC deployment resilience.

### 6.2 Out of Scope for MVP
- Application-layer instrumentation (deferred to v2).
- Network-layer monitoring and cross-layer correlation (deferred to v3).
- PagerDuty/Webhook integrations (deferred to v2+).

## 7. Success Metrics

**Primary**
- **SM-1**: 100% of simulated or real threshold breaches on registered server/DB components successfully generate an alert state and dispatch an email notification before outage occurrence. Validates FR-3, FR-4.

**Secondary**
- **SM-2**: Dashboard page load time under 2 seconds for viewing up to 50 monitored hybrid components. Validates FR-1, FR-2.

**Counter-metrics (do not optimize)**
- **SM-C1**: Alert fatigue rate — ensure threshold sensitivity does not result in more than 10% false-positive alerts per week. Counterbalances SM-1.

## 8. Open Questions
1. What are the exact SMTP server host and authentication credentials for the initial OBI deployment environment?
2. Are there specific corporate naming conventions for on-prem VMs that need auto-discovery tags in v1?

## 9. Assumptions Index
- Inline assumption from §4.1 — Pluggable SMTP configuration is sufficient for email dispatch without requiring advanced third-party email APIs in v1.
- Inline assumption from §4.2 — Standard Azure SQL database backups provide adequate recovery compliance for internal team needs.
