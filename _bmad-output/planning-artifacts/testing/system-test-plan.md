# System-Level Test Plan: Sentry_Ops

## 1. Test Strategy
The testing strategy for Sentry_Ops adopts a pragmatic, multi-layered approach balancing automated unit validation, integration testing for hybrid telemetry adapters, and end-to-end (E2E) workflow verification. 
- **Core Principle:** Verify fault isolation in background polling services so that intermittent hybrid network drops (VPN/AVD) never crash the monitoring engine.
- **Test Automation Hierarchy:**
  - **Unit Tests:** Rule evaluation engine, transient filtering (<3 min spike suppression), and threshold calculations.
  - **Integration Tests:** Adapter polling across mock endpoints (WMI, SSH, SNMP, SQL query probes) and pluggable SMTP email dispatch.
  - **UI/E2E Tests:** Dashboard rendering (<2s), real-time SignalR status updates, and interactive side action drawer diagnostic probes.

## 2. Test Scope
### In Scope
- **Component Registration (Epic 1):** CRUD operations and connectivity validation for 4-layer components across Azure and On-Prem environments.
- **Adaptive Polling Engine (Epic 2):** Dynamic interval scaling (10s–60s) and background polling fault isolation.
- **Threshold Alerting & Correlation (Epic 3):** Smart transient filtering, pluggable SMTP dispatch, time-based auto-escalation (15 min), and cross-layer correlation rule evaluation.
- **Operations Dashboard & UI (Epic 4):** Real-time gauges, visual dependency graphs, and side action drawer diagnostic execution.

### Out of Scope for v1
- Advanced machine learning anomaly prediction models.
- Multi-tenant data isolation testing.
- Mobile device responsiveness testing.

## 3. Risk Assessment & Mitigation
| Risk | Probability | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Hybrid Network Flakiness (VPN/AVD drops)** | High | High | Implement rigorous mock-fault integration tests verifying that unreachable on-prem targets log warnings without blocking the polling loop. |
| **Alert Fatigue from False Positives** | Medium | High | Test transient filtering logic against simulated brief metric spikes (<3 mins) to verify zero email noise is generated. |
| **Real-Time UI Performance Degradation** | Low | Medium | Enforce UI render performance benchmarks (<2s for 50 components) and test SignalR reconnection resilience. |

## 4. Coverage Targets & Success Metrics
- **Functional Coverage:** 100% verification against FR-1 through FR-6.
- **Reliability Target:** Zero polling service crashes during simulated network partitions or dropped SSH/WMI/SNMP connections.
- **Alert Dispatch Target:** 100% successful SMTP email dispatch on sustained threshold breaches.
- **UI Responsiveness Target:** Dashboard initial render and status updates within 2 seconds for up to 50 concurrent components.
