---
stepsCompleted: ["step-01", "step-02", "step-03", "step-04"]
inputDocuments: ["_bmad-output/planning-artifacts/prds/prd-Sentry_Ops-2026-08-10/prd.md", "_bmad-output/planning-artifacts/architecture/ARCHITECTURE-SPINE.md"]
status: final
---

# Sentry_Ops - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Sentry_Ops, decomposing the requirements from the PRD and Architecture requirements into implementable stories across all four layers (Server, Database, Application, Network).

## Requirements Inventory

### Functional Requirements

- **FR-1**: Administrators can register components across all 4 layers (Server, Database, Application, Network) specifying their environment type (Azure vs On-Prem), endpoint/connection details, and polling interval.
- **FR-2**: The backend polling engine periodically collects health metrics across all 4 layers: Server (CPU, Memory, Disk), Database (Query Latency, Connection Pool), Application (Request Rate, Error Rate, Response Time), and Network (Packet Loss, Latency, Bandwidth) across hybrid boundaries.
- **FR-3**: Users can define and update warning and critical thresholds per component across all four layers.
- **FR-4**: The system dispatches formatted email alerts via pluggable SMTP configuration to designated team email aliases and tracks alert lifecycle states (Firing, Acknowledged, Resolved) alongside cross-layer correlation.

### NonFunctional Requirements

- **NFR-1**: Polling execution for hybrid endpoints across all 4 layers must complete within a 60-second polling window for up to 50 concurrent components. Dashboard views and component health status updates must render within 2 seconds.
- **NFR-2**: A network timeout or failure when polling an individual on-prem or cloud component must log a warning status without crashing or blocking the background polling service loop. Monitored metric history and alert state transitions must be durably stored in Azure SQL.
- **NFR-3**: All metric collection across hybrid boundaries must occur over encrypted tunnels (VPN / AVD). Database connection strings and SMTP credentials must be securely stored using encrypted configuration settings or environment variables.
- **NFR-4**: All alert state changes (Firing → Acknowledged → Resolved) must record timestamp and operator context for internal operational review.

### Additional Requirements

- **TECH-1**: .NET 8 ASP.NET Core Modular Monolith backend API with decoupled React + TypeScript SPA frontend.
- **TECH-2**: Azure cloud hosting (App Service / Container Apps + Azure SQL Database) with Infrastructure-as-Code (Bicep/Terraform).
- **TECH-3**: Secure VPN / AVD tunnel network integration for hybrid on-prem-to-Azure target reachability.
- **TECH-4**: Built-in health check endpoints (`/health`) and structured JSON logging via Serilog.

### UX Design Requirements

- N/A (Internal tool utilizing standard responsive React components).

### FR Coverage Map

- **FR-1**: Epic 1 (4-Layer Component Registration & Schema) & Epic 4 (Dashboard Management View)
- **FR-2**: Epic 2 (4-Layer Hybrid Metric Polling & Ingestion Engine)
- **FR-3**: Epic 3 (Configurable Alert Thresholds & Rule Engine)
- **FR-4**: Epic 3 (Pluggable SMTP Email Dispatch & Correlation) & Epic 4 (Alert Lifecycle Management Views)

## Epic List

### Epic 1: Foundation & 4-Layer Hybrid Component Management
Establish the .NET 8 / React project scaffold, Azure SQL database persistence, IaC deployment scripts, health check endpoint, and component registration supporting all 4 layers (Server, Database, Application, Network) across Azure and On-Prem environments.
**FRs covered:** FR-1, TECH-1, TECH-2, TECH-3, TECH-4, NFR-3.

### Epic 2: 4-Layer Hybrid Metric Polling & Ingestion Engine
Implement the background polling service that securely collects hybrid metrics across all 4 layers (Server vitals, Database query/connection stats, Application telemetry, and Network probes) across VPN/AVD tunnels and persists them durably with fault isolation.
**FRs covered:** FR-2, NFR-1, NFR-2, NFR-3.

### Epic 3: Proactive Threshold Alerting, Correlation & Pluggable Email Notifications
Enable users to define and evaluate warning/critical thresholds across all four layers, execute cross-layer correlation rules (e.g., DB latency + server CPU), and dispatch formatted email alerts via pluggable SMTP with alert lifecycle state tracking.
**FRs covered:** FR-3, FR-4, NFR-4.

### Epic 4: Operations Dashboard & Real-Time 4-Layer Status Views
Provide the React SPA dashboard with real-time metric gauges, multi-layer health status indicators, and alert state management controls.
**FRs covered:** FR-1, FR-4, NFR-1.

---

## Epic 1: Foundation & 4-Layer Hybrid Component Management

Establish the .NET 8 / React project scaffold, Azure SQL database persistence, IaC deployment scripts, health check endpoint, and component registration supporting all 4 layers (Server, Database, Application, Network) across Azure and On-Prem environments.

### Story 1.1: Project Scaffold & Database Initialization
As a developer, I want to initialize the .NET 8 ASP.NET Core Modular Monolith solution and React SPA frontend with Azure SQL database connectivity and EF Core context, so that the core application structure and persistence layer are ready.

**Acceptance Criteria:**
- **Given** an empty project directory, **When** the .NET 8 Web API and React TypeScript projects are initialized, **Then** the solution builds successfully without errors.
- **Given** EF Core is configured in .NET 8, **When** initial database migrations are executed against Azure SQL, **Then** the core schema for components and configuration is created successfully.

### Story 1.2: Infrastructure-as-Code (IaC) & Health Check Endpoint
As a DevOps operator, I want Bicep/Terraform scripts for Azure deployment and a built-in `/health` endpoint with Serilog JSON logging, so that Sentry_Ops can be reliably deployed and monitored.

**Acceptance Criteria:**
- **Given** Bicep/Terraform infrastructure templates, **When** deployed to Azure, **Then** App Service and Azure SQL instances are provisioned correctly.
- **Given** the application is running, **When** a GET request is sent to `/health`, **Then** the system returns HTTP 200 with service health status and Serilog JSON logs are emitted.

### Story 1.3: 4-Layer Hybrid Component Registration API & UI
As an administrator, I want to register and manage components across all 4 layers (Server, Database, Application, Network) specifying their environment type (Azure vs On-Prem), endpoint/connection details, and polling interval, so that target entities are tracked in Sentry_Ops.

**Acceptance Criteria:**
- **Given** the component registration form in React, **When** an admin submits a component with layer type (Server/DB/App/Net), environment (Azure/On-Prem via VPN/AVD), endpoint URL/IP, and polling interval, **Then** the component is successfully saved to Azure SQL via API.
- **Given** registered components, **When** connectivity validation runs upon registration, **Then** the system verifies reachability and stores the component status.

---

## Epic 2: 4-Layer Hybrid Metric Polling & Ingestion Engine

Implement the background polling service that securely collects hybrid metrics across all 4 layers (Server vitals, Database query/connection stats, Application telemetry, and Network probes) across VPN/AVD tunnels and persists them durably with fault isolation.

### Story 2.1: Background Polling Service & Fault Isolation
As a backend engineer, I want a robust background hosted service in .NET 8 that polls registered components every 60 seconds with fault isolation, so that a failure in polling one component does not crash the polling loop.

**Acceptance Criteria:**
- **Given** multiple registered hybrid components, **When** the background polling timer triggers, **Then** metrics are collected concurrently across all components within the 60-second window.
- **Given** a network timeout or unreachable on-prem endpoint via VPN/AVD, **When** the poll fails, **Then** a warning is logged, component status is marked unreachable, and the polling loop continues unaffected.

### Story 2.2: 4-Layer Metric Collection Adapters
As a system architect, I want specialized metric collection adapters for Server (CPU, Memory, Disk), Database (Query Latency, Connection Pool), Application (Request Rate, Error Rate), and Network (Packet Loss, Latency), so that heterogeneous telemetry is ingested uniformly.

**Acceptance Criteria:**
- **Given** an active poll cycle for a Server component, **When** WMI/SSH/metrics probes execute, **Then** CPU %, Memory %, and Disk Space % are successfully ingested.
- **Given** active poll cycles for DB, App, and Network components, **When** connection probes and telemetry endpoints are queried, **Then** query latency, request error rates, and packet loss metrics are successfully recorded into Azure SQL.

---

## Epic 3: Proactive Threshold Alerting, Correlation & Pluggable Email Notifications

Enable users to define and evaluate warning/critical thresholds across all four layers, execute cross-layer correlation rules (e.g., DB latency + server CPU), and dispatch formatted email alerts via pluggable SMTP with alert lifecycle state tracking.

### Story 3.1: Configurable Thresholds & Rule Evaluation Engine
As an operator, I want to define warning and critical thresholds per component and have the evaluation engine check incoming metric batches against them, so that sustained breaches trigger alerts.

**Acceptance Criteria:**
- **Given** threshold rules configured for a component (e.g., CPU > 85% for 5 mins), **When** incoming metrics breach the limit for the specified duration, **Then** the alert state transitions from Healthy to *Firing*.
- **Given** multi-layer metric data, **When** a database latency spike coincides with high server CPU and increased app error rates, **Then** the cross-layer correlation rule flags a correlated root-cause event.

### Story 3.2: Pluggable SMTP Email Notifications & State Tracking
As a team lead, I want formatted email alerts dispatched via pluggable SMTP to designated team email aliases when alerts fire, along with in-tool state tracking (Firing, Acknowledged, Resolved), so that my team can act promptly.

**Acceptance Criteria:**
- **Given** an alert transitions to *Firing*, **When** the notification dispatch service runs, **Then** an email alert containing component details and metric values is successfully sent via SMTP to the configured recipient alias.
- **Given** a firing alert, **When** an engineer updates its status in the dashboard, **Then** the alert lifecycle state updates to *Acknowledged* or *Resolved* with timestamp and operator audit logging recorded in Azure SQL.

---

## Epic 4: Operations Dashboard & Real-Time 4-Layer Status Views

Provide the React SPA dashboard with real-time metric gauges, multi-layer health status indicators, and alert state management controls.

### Story 4.1: Real-Time Multi-Layer Status Dashboard UI
As an ops engineer, I want a centralized React dashboard displaying real-time health gauges and status indicators for all monitored components across Server, DB, App, and Network layers, so I can monitor system health at a glance.

**Acceptance Criteria:**
- **Given** authenticated access to the React dashboard, **When** the page loads, **Then** component health statuses across all 4 layers render within 2 seconds.
- **Given live metric updates**, **When** SignalR WebSocket events arrive from the backend, **Then** dashboard gauges and status badges update in real time without requiring manual page refreshes.

### Story 4.2: Alert Management & Incident Lifecycle UI
As an operator, I want dedicated UI views to view active firing alerts, inspect cross-layer correlations, and transition alert statuses (Acknowledge / Resolve), so that incident triage is streamlined.

**Acceptance Criteria:**
- **Given** active firing alerts in the system, **When** the operator opens the Alerts view, **Then** alerts are listed with severity, layer badge, timestamp, and current state.
- **Given** an active alert selected by the operator, **When** the operator clicks "Acknowledge" or "Resolve", **Then** the action calls the backend API and updates the alert state in real time across the UI.
