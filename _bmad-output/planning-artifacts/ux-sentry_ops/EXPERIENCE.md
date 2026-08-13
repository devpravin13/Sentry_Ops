---
title: "EXPERIENCE.md: Sentry_Ops"
status: "final"
created: "2026-08-10"
updated: "2026-08-10
---

# Experience Specification: Sentry_Ops

## Foundation
- **Form-Factor:** Responsive Web Application (Desktop-first optimized for operations command centers, fully responsive for mobile/tablet).
- **UI System:** Custom utility-first CSS (Tailwind CSS) paired with Lucide icons.
- **Visual Identity Reference:** `{design.colors.background}` (White base with black structure and vibrant orange accents).

## Information Architecture
1. **Dashboard & Metrics View (Primary Landing):**
   - Summary KPI Cards (Monitored components, Firing alerts, Avg DB query latency, App error rate).
   - 4-Layer Filter & Search Bar (Server, Database, Application, Network + Azure vs On-Prem).
   - Real-Time Metric Grid with status badges and simulation triggers.
2. **Component Registry View:**
   - Table management for registering, inspecting, and deleting hybrid targets.
   - Registration modal with endpoint, interval, and layer configuration.
3. **Alerts & Notifications View:**
   - Active incident listing with pluggable SMTP routing status.
   - Acknowledge / Resolve lifecycle actions.
4. **Side Action Drawer:**
   - Triggered instantly upon clicking any component or alert card.
   - Houses one-click diagnostic connection probes and remediation note logging.

## Voice and Tone
- **Tone:** Professional, direct, calm, and urgent only when firing alerts require attention.
- **Microcopy:** Concise telemetry descriptions, clear error states, and actionable button labels ("Simulate Breach", "Run Diagnostic", "Acknowledge").

## Component Patterns
- **Status Badges:** Color-coded pill badges (*Healthy* in green, *Firing* in pulsing orange).
- **Metric Cards:** Structured panels highlighting current metric value against configured thresholds.

## State Patterns
- **Loading State:** Skeleton loaders or subtle pulse indicators during hybrid telemetry polling.
- **Empty State:** Clean centered messages ("No active firing alerts. All systems healthy.").
- **Firing State:** Orange border highlight and glowing ping indicator.

## Interaction Primitives
- Tab switching without page reloads.
- Instant modal dialog open/close for component registration.
- Side action drawer overlay with smooth slide-in animation.

## Accessibility Floor
- High contrast black text on crisp white/off-white backgrounds exceeding WCAG 2.1 AA standards.
- Clear keyboard focus rings on all interactive elements.

## Key Flows
- **UJ-1. Alex checks hybrid cluster vitals:** Alex opens dashboard → filters by On-Prem → reviews DB query latency gauge → clicks component to open action drawer → runs diagnostic probe.
- **UJ-2. Ops team responds to alert:** Engineer receives SMTP email alert → opens Sentry_Ops alerts tab → clicks "Acknowledge" → reviews cross-layer correlation → resolves incident with remediation note.
