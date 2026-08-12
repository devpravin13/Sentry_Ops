# Comprehensive Technical Research: Unified Hybrid Infrastructure & Application Monitoring

## Executive Summary
This technical research document outlines the architectural paradigms, implementation patterns, integration protocols, and performance benchmarks for **Sentry_Ops**. Built on a modular monolith .NET 8 backend and a decoupled React TypeScript SPA, Sentry_Ops leverages adaptive background polling, EF Core persistence in Azure SQL, real-time SignalR event streaming, and secure hybrid tunneling (VPN/AVD) to deliver resilient, low-latency unified observability.

## Table of Contents
1. Technical Research Introduction and Methodology
2. Modular Monolith Architecture & System Design
3. Hybrid Ingestion & Adaptive Polling Implementation
4. Integration, Security & Compliance Patterns
5. Strategic Technical Recommendations & Roadmap

---

## 1. Technical Research Introduction and Methodology
- **Significance:** Modern monitoring architectures require fault-isolated polling, low-overhead event streaming, and secure credential handling across hybrid boundaries.
- **Methodology:** Evaluation of .NET 8 hosting patterns, React state management, EF Core performance, and secure Azure networking.

## 2. Modular Monolith Architecture & System Design
- **Backend (.NET 8):** Domain-driven modular structure separating Component Registration, Metric Ingestion, Rule Evaluation, and Notification Dispatch.
- **Frontend (React + TypeScript):** Operator-first UI featuring real-time SignalR updates, component registry management, and interactive side action drawers.

## 3. Hybrid Ingestion & Adaptive Polling Implementation
- **Polling Engine:** Background hosted service (`IHostedService`) managing concurrent probes across Server (WMI/SSH), Database (SQL), Application (OpenTelemetry), and Network (SNMP).
- **Adaptive Heartbeat:** Dynamic interval scaling (10s–60s) to optimize network diagnostic response over VPN/AVD tunnels.

## 4. Integration, Security & Compliance Patterns
- **Transport Security:** IPsec VPN and Azure VNet private endpoints.
- **Secret Management:** Azure Key Vault / encrypted configuration for database strings and SMTP credentials.
- **Audit Logging:** Immutable timestamp and operator remediation tracking for alert lifecycles.

## 5. Strategic Technical Recommendations & Roadmap
- **Execution Strategy:** Proceed with developing backend domain modules and testing the React white/orange UI prototype (`index.html`) against simulated telemetry streams.

---
**Completion Date:** 2026-08-10
**Confidence Level:** High (Authoritative technical validation)
