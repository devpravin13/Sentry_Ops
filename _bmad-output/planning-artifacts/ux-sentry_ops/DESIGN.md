---
title: "DESIGN.md: Sentry_Ops"
status: "final"
created: "2026-08-10"
updated: "2026-08-10"
colors:
  background: "#FFFFFF"
  card: "#FAFAFA"
  surface: "#F9FAFB"
  textPrimary: "#111827"
  textSecondary: "#6B7280"
  border: "#E5E7EB"
  primary: "#FF6B00"
  primaryHover: "#E05D00"
  accentLight: "#FFF2EC"
typography:
  fontFamily: "Inter, system-ui, -apple-system, sans-serif"
  scale:
    xs: "0.75rem"
    sm: "0.875rem"
    base: "1rem"
    lg: "1.125rem"
    xl: "1.25rem"
    2xl: "1.5rem"
  weights:
    normal: "400"
    medium: "500"
    bold: "700"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.75rem"
  full: "9999px"
spacing:
  unit: "0.25rem"
  cardPadding: "1rem"
  sectionGap: "1.5rem"
components:
  button: "Rounded-lg font-medium px-3.5 py-1.5 transition-all shadow-sm"
  card: "Border border-brand-border bg-brand-card rounded-xl p-4 shadow-sm"
  badge: "Inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
---

# Design System: Sentry_Ops

## Brand & Style
Sentry_Ops embraces an **operator-first, high-clarity minimalist aesthetic** tailored for internal engineering teams. It prioritizes data density, zero visual noise, and immediate situational awareness during high-stress incident triage.

## Colors
- **Background:** Crisp White (`#FFFFFF`) providing 60-70% neutral canvas surface.
- **Surface / Cards:** Off-white / light gray (`#FAFAFA` to `#F9FAFB`) for structured container grouping.
- **Text & Structure:** Deep Charcoal / Black (`#111827`) for extreme legibility.
- **Primary Action & Alert Accent:** Vibrant Orange (`#FF6B00`) for primary buttons, active firing indicators, and interactive highlights.

## Typography
- **Font Family:** Inter / System UI sans-serif.
- **Scale:** Clean hierarchy ranging from 12px (badges/metadata) to 24px (KPI metrics).
- **Weight Strategy:** Restrained usage of bold weights; reliance on medium (`500`) and regular (`400`) for clean readability without visual fatigue.

## Layout & Spacing
- **Grid System:** Responsive multi-column grid adapting from single-column mobile to 3-column dashboard metric cards.
- **Padding & Gaps:** Standardized 1rem card padding with 1.5rem section spacing.

## Elevation & Depth
- Flat, modern border-driven cards (`border-brand-border`) with subtle shadow elevation on hover or active modal states.

## Shapes
- Soft rounded rectangles (`rounded-lg`, `rounded-xl`) for cards, buttons, and modals.

## Components
- **Buttons:** Vibrant orange primary buttons with dark orange hover states; neutral white secondary buttons with subtle borders.
- **Cards:** Layered white/off-white containers with light gray borders and color-coded status badges.
- **Action Drawer:** Side sliding panel for instant diagnostics and remediation note logging.

## Do's and Don'ts
- **Do:** Keep backgrounds predominantly white/light gray to maintain high contrast and clarity.
- **Do:** Use orange strictly for interactive CTAs, active firing alerts, and primary focal points.
- **Don't:** Introduce unconstrained neon colors or heavy dark-mode themes in v1.
- **Don't:** Rely on heavy text bolding for standard parameters.
