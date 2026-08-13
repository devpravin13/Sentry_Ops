const fs = require("fs");
const path = require("path");

/*
    Sentry_Ops — Hybrid Health & Resilience data generator (extended).

    Produces public/data.json with a rich telemetry model that powers
    every dashboard capability:
      - components  : 4 monitoring layers x Azure/On-Prem targets,
                      each with adaptive poll intervals (10s-60s),
                      transient-filter state (<3m), auto-escalation
                      timers (15m), cross-layer correlation, diagnostic
                      probe metadata and routing team.
      - alerts      : firing incidents with severity, smart-routing
                      alias, auto-escalation countdown and correlation.
      - correlations: active cross-layer anomaly chains (root + affected).
      - config      : feature toggles + live counters for the UI chrome.
      - history     : 2h health/incidents trend for the charts.
      - resilience  : RTO / backup / recovery drill targets.
*/

const layers = ["Network", "Application", "Database", "Server"];
const environments = ["Azure", "On-Prem"];
const pollBase = ["30s", "60s", "60s", "60s"];

const prefixes = {
    Network: [
        "core-switch", "vpn-gateway", "ingress-proxy",
        "edge-router", "firewall", "load-balancer"
    ],
    Application: [
        "auth-service", "payment-service", "order-service",
        "api-gateway", "web-portal", "inventory-service"
    ],
    Database: [
        "prod-sql", "core-db", "analytics-db",
        "redis-cache", "postgres-db", "replica-db"
    ],
    Server: [
        "prod-vm", "app-server", "web-server",
        "worker-node", "backup-server", "hypervisor"
    ]
};

const teams = {
    Network: "network-team@sentry.local",
    Application: "application-team@sentry.local",
    Database: "database-team@sentry.local",
    Server: "server-team@sentry.local"
};

const probeByLayer = {
    Network: "SNMP",
    Application: "Health / API",
    Database: "TCP",
    Server: "WMI"
};

const metricConfig = {
    Network: {
        metricName: "Packet Loss",
        threshold: "2.0%",
        unit: "%",
        digits: 2,
        key: "packetLoss",
        firingWhen: value => value > 2
    },
    Application: {
        metricName: "Error Rate",
        threshold: "1.0%",
        unit: "%",
        digits: 2,
        key: "errorRate",
        firingWhen: value => value > 1
    },
    Database: {
        metricName: "Query Latency",
        threshold: "500 ms",
        unit: " ms",
        digits: 0,
        key: "latency",
        firingWhen: value => value > 500
    },
    Server: {
        metricName: "CPU Usage",
        threshold: "85%",
        unit: "%",
        digits: 1,
        key: "cpu",
        firingWhen: value => value > 85
    }
};

function random(min, max) {
    return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
    return Math.floor(random(min, max + 1));
}

function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function round(value, decimals = 1) {
    return Number(value.toFixed(decimals));
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function randomIp() {
    return `${randomInt(10, 192)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`;
}

function formatMetric(key, value, unit, digits) {
    if (key === "latency") return `${Math.round(value)}${unit}`;
    return `${Number(value).toFixed(digits)}${unit}`;
}

/*
    Severity model used by the smart routing engine.
    Critical fires when the overshoot is aggressive; High otherwise;
    a small share of firing targets are Medium for realistic triage.
*/
function deriveSeverity(layer, metricName, metricValue) {
    if (layer === "Network") {
        return metricValue > 4 ? "Critical" : "High";
    }
    if (layer === "Application") {
        return metricValue > 2 ? "Critical" : "High";
    }
    if (layer === "Database") {
        return metricValue > 600 ? "Critical" : "High";
    }
    if (layer === "Server") {
        return metricValue > 90 ? "Critical" : "High";
    }

    return "High";
}

function generateComponent(id, layer) {
    const environment = pick(environments);
    const prefix = pick(prefixes[layer]);
    const name = `${prefix}-${String(randomInt(1, 99)).padStart(2, "0")}`;
    const config = metricConfig[layer];

    let metrics = {};
    let endpoint = "";

    switch (layer) {
        case "Server":
            metrics = {
                cpu: round(random(15, 82)),
                memory: round(random(35, 78)),
                disk: round(random(40, 88))
            };
            endpoint = `${randomIp()}:22`;
            break;

        case "Database":
            metrics = {
                latency: randomInt(40, 460),
                connections: randomInt(20, 240),
                connectionLimit: randomInt(200, 400),
                storage: round(random(35, 92))
            };
            metrics.poolUtilization = round(
                (metrics.connections / metrics.connectionLimit) * 100,
                1
            );
            endpoint = `${randomIp()}:1433`;
            break;

        case "Application":
            metrics = {
                responseTime: randomInt(50, 420),
                errorRate: round(random(0.01, 0.95), 2),
                requestRate: round(random(8, 220), 1),
                availability: round(random(96, 100), 2)
            };
            endpoint = `https://${name}.internal/health`;
            break;

        case "Network":
            metrics = {
                packetLoss: round(random(0, 1.9), 2),
                bandwidth: round(random(0.5, 3), 2),
                latency: randomInt(10, 160)
            };
            endpoint = `${randomIp()} (SNMP)`;
            break;
    }

    const primaryValue = metrics[config.key];
    const isFiring = config.firingWhen(primaryValue);
    const severity = isFiring
        ? deriveSeverity(layer, config.metricName, primaryValue)
        : "Low";

    const baseInterval = pick(pollBase);

    /*
        Adaptive polling (10s-60s):
        - Firing targets are watched at the fastest 10s cadence.
        - Suppressed (transient) targets hold base cadence.
        - Healthy targets run at their base cadence within the 10-60s band.
    */
    const transientSuppressed = !isFiring && Math.random() < 0.35;

    /*
        NFR-5 cadence model:
        - Firing targets accelerate to 10s-15s high-fidelity cadence.
        - Suppressed (transient) and healthy targets hold a 30s-60s baseline.
    */
    const pollSeconds = isFiring
        ? (Math.random() < 0.45 ? 15 : 10)
        : Math.max(10, Math.min(60, parseInt(baseInterval, 10) || 30));

    const suppressedSince = transientSuppressed
        ? `${randomInt(1, 8)} mins ago`
        : null;

    const escalationSeconds = isFiring || transientSuppressed
        ? randomInt(2, 15)
        : null;

    const probeStatus = isFiring
        ? "degraded"
        : Math.random() < 0.06
            ? "unreachable"
            : "ok";

    return {
        id,
        name,
        layer,
        environment,
        endpoint,
        probeType: probeByLayer[layer],
        interval: `${pollSeconds}s`,
        baseInterval,
        status: isFiring ? "Firing" : "Healthy",
        alertState: isFiring ? "Firing" : "Normal",
        severity,
        team: teams[layer],
        metricName: config.metricName,
        metricValue: formatMetric(config.key, primaryValue, config.unit, config.digits),
        threshold: config.threshold,
        metrics,

        adaptivePoll: {
            enabled: true,
            mode: "Auto",
            rangeMin: 10,
            rangeMax: 60,
            current: `${pollSeconds}s`,
            base: baseInterval,
            rationale: isFiring
                ? `Firing — poll accelerated to ${pollSeconds}s high-fidelity cadence for faster recovery signal.`
                : transientSuppressed
                    ? "Transient suppressed — polling held at baseline cadence."
                    : "Healthy — polling at baseline cadence inside 10s-60s band."
        },

        transientFilter: {
            enabled: true,
            window: "<3m",
            active: true,
            suppressed: transientSuppressed,
            suppressedSince,
            autoRetestIn: transientSuppressed ? `${randomInt(1, 2)}m` : null
        },

        autoEscalation: {
            enabled: true,
            timer: "15m",
            timerSeconds: 900,
            remaining: escalationSeconds === null ? null : `${escalationSeconds}m`,
            status: isFiring
                ? "Monitoring"
                : transientSuppressed
                    ? "Holding"
                    : "Idle",
            secondaryAlias: "oncall-secondary@sentry.local"
        },

        correlation: {
            summary: "No active cascade anomalies detected for this target.",
            role: "Stable",
            relatedLayers: []
        },

        diagnostics: {
            probeType: probeByLayer[layer],
            lastProbe: {
                status: probeStatus,
                rtt: isFiring
                    ? `${randomInt(120, 420)}ms`
                    : probeStatus === "unreachable"
                        ? "timeout"
                        : `${randomInt(4, 38)}ms`,
                packetLoss: isFiring
                    ? `${round(random(0, 4), 2)}%`
                    : probeStatus === "unreachable"
                        ? "N/A"
                        : "0.0%",
                performedAt: probeStatus === "unreachable"
                    ? "last retry in 15s"
                    : "just now"
            }
        },

        registeredAt: `2026-08-${String(randomInt(1, 12)).padStart(2, "0")}`
    };
}

/*
    Build cross-layer correlation chains and annotate the involved
    components. A chain is rooted at a Network or Server anomaly that
    propagates to Database then Application latencies / errors.
*/
function buildCorrelations(components) {
    const byLayer = layer => components.filter(c => c.layer === layer);
    const firing = layer => byLayer(layer).filter(c => c.alertState === "Firing");

    const chains = [];
    let chainId = 1;

    const narrative = (root, affectedList) => {
        const names = affectedList.map(x => x.name).join(", ");
        return `${root.layer} ${root.metricName} on ${root.name} is correlated with degraded ${affectedList.map(x => x.layer).join(" / ")} (${
            names
        }) — cascade detected within the correlation window.`;
    };

    const linkTarget = (component, role) => {
        const correlated = {
            ...component.correlation,
            role: role
        };

        if (role === "Root Cause") {
            correlated.summary = `${component.layer} anomaly is driving cascading failures downstream across ${component.correlation.relatedLayers.join(", ")}.`;
        } else if (role === "Affected") {
            correlated.summary = "Degradation propagated from an upstream layer anomaly.";
        }

        component.correlation = correlated;
    };

    // Network -> Database -> Application chain
    const networkFiring = firing("Network");
    if (networkFiring.length > 0) {
        const root = networkFiring[0];

        const dbVictim = firing("Database").find(
            c => c.environment === root.environment
        ) || firing("Database")[0];

        const appVictim = firing("Application").find(
            c => c.environment === root.environment
        ) || firing("Application")[0];

        const affected = [];
        if (dbVictim) affected.push(dbVictim);
        if (appVictim) affected.push(appVictim);
        if (affected.length === 0) return chains;

        root.correlation = {
            summary: `Cascading: ${root.layer} ${root.metricName} → ${affected.map(x => x.layer).join(" → ")} latency/error elevation.`,
            role: "Root Cause",
            relatedLayers: affected.map(x => x.layer)
        };
        linkTarget(root, "Root Cause");

        affected.forEach(target => {
            target.correlation = {
                summary: "Degradation propagated from an upstream layer anomaly.",
                role: "Affected",
                relatedLayers: [root.layer]
            };
        });

        chains.push({
            id: chainId++,
            status: "Active",
            confidence: randomInt(86, 96),
            detectedAt: `${randomInt(2, 14)} mins ago`,
            narrative: narrative(root, affected),
            root: {
                layer: root.layer,
                component: root.name,
                metric: `${root.metricName} (${root.metricValue})`
            },
            affected: affected.map(target => ({
                layer: target.layer,
                component: target.name,
                metric: `${target.metricName} (${target.metricValue})`,
                lag: `${randomInt(1, 5)}m`
            }))
        });
    }

    // Server -> Application response-time chain (independent of the first)
    const serverFiring = firing("Server");
    if (serverFiring.length > 0 && chains.length < 2) {
        const root = serverFiring[0];
        const appVictim = firing("Application").find(
            c => c.environment === root.environment
        ) || firing("Application")[0];

        if (appVictim && chains.length < 2) {
            root.correlation = {
                summary: `Cascading: ${root.layer} CPU saturation → ${appVictim.layer} response-time elevation.`,
                role: "Root Cause",
                relatedLayers: [appVictim.layer]
            };
            appVictim.correlation = {
                summary: "Degradation propagated from an upstream layer anomaly.",
                role: "Affected",
                relatedLayers: [root.layer]
            };

            chains.push({
                id: chainId++,
                status: "Active",
                confidence: randomInt(80, 92),
                detectedAt: `${randomInt(1, 9)} mins ago`,
                narrative: `${root.layer} CPU saturation on ${root.name} is correlated with elevated ${appVictim.layer} response times (${appVictim.name}).`,
                root: {
                    layer: root.layer,
                    component: root.name,
                    metric: `${root.metricName} (${root.metricValue})`
                },
                affected: [{
                    layer: appVictim.layer,
                    component: appVictim.name,
                    metric: `${appVictim.metricName} (${appVictim.metricValue})`,
                    lag: `${randomInt(1, 4)}m`
                }]
            });
        }
    }

    return chains;
}

function buildAlerts(components, chains) {
    const correlationByComponent = new Map();

    chains.forEach(chain => {
        correlationByComponent.set(chain.root.component, chain);
        chain.affected.forEach(affected => {
            correlationByComponent.set(affected.component, chain);
        });
    });

    return components
        .filter(component => component.status === "Firing")
        .map((component, index) => {
            const related = correlationByComponent.get(component.name);
            const remaining = component.autoEscalation.remaining;
            const escalated = component.severity === "Critical" && index === 0;

            return {
                id: Date.now() + index,
                component: component.name,
                layer: component.layer,
                environment: component.environment,
                metric: `${component.metricName} (${component.metricValue})`,
                summary: `${component.metricName} above ${component.threshold} threshold.`,
                time: `${randomInt(1, 30)} mins ago`,
                state: "Firing",
                status: escalated ? "Escalated" : "Firing",
                severity: component.severity,
                alertState: component.alertState,
                alias: component.team,
                transientFiltered: false,
                escalation: {
                    enabled: true,
                    timer: "15m",
                    timerSeconds: 900,
                    remainingSeconds: escalated ? 0 : randomInt(120, 900),
                    remaining,
                    escalated,
                    secondaryAlias: component.autoEscalation.secondaryAlias
                },
                correlation: related
                    ? related.narrative
                    : "Isolated — no cross-layer relationship detected."
            };
        });
}

/*
    Coherent 2h history. Per-layer health is a bounded random walk that
    converges to the CURRENT per-layer health snapshot, so the trend chart
    ends exactly where the live dashboard is right now. Incident and
    transient-suppressed counts are derived from the same per-layer health
    values (a layer dipping below 90% contributes incidents; brief dips
    feed the transient-silencing counter), and the final bucket matches the
    live alert / suppression state.
*/
function layerHealthNow(components) {
    const snapshot = {};

    layers.forEach(layer => {
        const items = components.filter(c => c.layer === layer);
        const healthy = items.filter(c => c.status === "Healthy").length;

        snapshot[layer] = items.length
            ? Math.round((healthy / items.length) * 100)
            : 0;
    });

    return snapshot;
}

function generateHistory(components, alerts, suppressedCountNow) {
    const current = layerHealthNow(components);
    const drift = { ...current };
    const buckets = [];
    let suppressedTotal = 0;

    for (let i = 23; i >= 0; i--) {
        const date = new Date(Date.now() - i * 5 * 60 * 1000);
        const bucket = {
            time: date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
        };

        if (i === 0) {
            layers.forEach(layer => {
                bucket[layer] = current[layer];
            });
        } else {
            layers.forEach(layer => {
                drift[layer] = clamp(
                    Math.round(drift[layer] + random(-3, 3)),
                    40,
                    100
                );
                bucket[layer] = drift[layer];
            });
        }

        const values = layers.map(layer => bucket[layer]);

        bucket.health = Math.round(
            values.reduce((sum, value) => sum + value, 0) / layers.length
        );
        bucket.incidents = i === 0
            ? Math.min(alerts.length, 8)
            : layers.filter(layer => bucket[layer] < 90).length;
        bucket.suppressed = i === 0
            ? suppressedCountNow
            : randomInt(0, 3);

        suppressedTotal += bucket.suppressed;

        buckets.push(bucket);
    }

    return { history: buckets, suppressedTotal };
}

/*
    Per-metric 2h series for the dashboard trend charts. Each series is
    driven by the same per-layer health walk, so a dip in a layer's health
    pushes its own key metric toward (or past) threshold at the exact same
    time bucket — the charts tell one coherent story with the layer status
    strip above. `threshold` is the configured breach level (null when the
    metric has no alert threshold, e.g. request rate).
*/
function generateSeries(history) {
    const seriesConfig = [
        {
            key: "dbQueryLatency",
            layer: "Database",
            label: "Query Latency",
            unit: "ms",
            threshold: 500,
            base: 120,
            spike: 340,
            jitter: 18,
            min: 40,
            cap: 900,
            decimals: 0
        },
        {
            key: "dbPoolUtilization",
            layer: "Database",
            label: "Connection Pool Utilization",
            unit: "%",
            threshold: 85,
            base: 42,
            spike: 36,
            jitter: 4,
            min: 10,
            cap: 100,
            decimals: 0
        },
        {
            key: "appErrorRate",
            layer: "Application",
            label: "Error Rate",
            unit: "%",
            threshold: 1.0,
            base: 0.15,
            spike: 0.8,
            jitter: 0.06,
            min: 0,
            cap: 4,
            decimals: 2
        },
        {
            key: "appResponseTime",
            layer: "Application",
            label: "Response Time",
            unit: "ms",
            threshold: 500,
            base: 140,
            spike: 300,
            jitter: 20,
            min: 60,
            cap: 900,
            decimals: 0
        },
        {
            key: "appRequestRate",
            layer: "Application",
            label: "Request Rate",
            unit: "req/s",
            threshold: null,
            base: 820,
            spike: 0,
            jitter: 60,
            min: 300,
            cap: 1600,
            decimals: 0
        },
        {
            key: "networkPacketLoss",
            layer: "Network",
            label: "Packet Loss",
            unit: "%",
            threshold: 2.0,
            base: 0.15,
            spike: 1.6,
            jitter: 0.12,
            min: 0,
            cap: 8,
            decimals: 2
        },
        {
            key: "networkLatency",
            layer: "Network",
            label: "Latency",
            unit: "ms",
            threshold: 120,
            base: 24,
            spike: 80,
            jitter: 6,
            min: 5,
            cap: 300,
            decimals: 0
        },
        {
            key: "serverCpu",
            layer: "Server",
            label: "CPU Utilization",
            unit: "%",
            threshold: 80,
            base: 45,
            spike: 30,
            jitter: 5,
            min: 10,
            cap: 99,
            decimals: 1
        }
    ];

    const series = {};

    seriesConfig.forEach(cfg => {
        const points = history.map(bucket => {
            const layerHealth = bucket[cfg.layer] ?? 100;
            const pressure = layerHealth < 90
                ? (90 - layerHealth) / 10
                : 0;

            const value = clamp(
                cfg.base +
                    pressure * cfg.spike +
                    random(-cfg.jitter, cfg.jitter),
                cfg.min,
                cfg.cap
            );

            return {
                time: bucket.time,
                value: round(value, cfg.decimals)
            };
        });

        series[cfg.key] = {
            label: cfg.label,
            layer: cfg.layer,
            unit: cfg.unit,
            threshold: cfg.threshold,
            window: "2h",
            points
        };
    });

    return series;
}

const components = [];
let id = 1;

layers.forEach(layer => {
    const count = randomInt(5, 8);

    for (let i = 0; i < count; i++) {
        components.push(generateComponent(id++, layer));
    }
});

const suppressedComponents = components.filter(
    component => component.transientFilter.suppressed
);

/*
    Guarantee at least one Network -> Database -> Application chain so the
    correlation engine always has something to surface. We force the first
    Network target (and matching-env Database/Application victims) past
    their thresholds when randomness didn't already produce them.
*/
function forceFiring(component) {
    const config = metricConfig[component.layer];
    const value = component.metrics[config.key];

    component.metrics[config.key] = Math.max(
        value,
        config.key === "latency"
            ? 640
            : config.key === "packetLoss"
                ? 4.4
                : config.key === "errorRate"
                    ? 2.2
                    : 91
    );

    component.metricValue = formatMetric(
        config.key,
        component.metrics[config.key],
        config.unit,
        config.digits
    );

    component.status = "Firing";
    component.alertState = "Firing";
    component.severity = deriveSeverity(component.layer, config.metricName, component.metrics[config.key]);
    component.adaptivePoll.current = "10s";
    component.adaptivePoll.rationale =
        "Firing — poll tightened to 10s for faster recovery signal.";
    component.transientFilter.suppressed = false;
}

const firingNetwork = components.filter(
    c => c.layer === "Network" && c.alertState === "Firing"
);

let networkRoot = firingNetwork[0];

if (!networkRoot) {
    networkRoot = components.find(c => c.layer === "Network");
    forceFiring(networkRoot);
}

const networkEnv = networkRoot.environment;

const dbVictim = components.find(
    c => c.layer === "Database" &&
        c.environment === networkEnv &&
        c.alertState === "Firing"
) || components.find(
    c => c.layer === "Database" && c.environment === networkEnv
);

const appVictim = components.find(
    c => c.layer === "Application" &&
        c.environment === networkEnv &&
        c.alertState === "Firing"
) || components.find(
    c => c.layer === "Application" && c.environment === networkEnv
);

if (dbVictim) forceFiring(dbVictim);
if (appVictim) forceFiring(appVictim);

const correlations = buildCorrelations(components);

const alerts = buildAlerts(components, correlations);

const escalatedCount = alerts.filter(
    alert => alert.escalation.escalated
).length;

/*
    Adaptive polling distribution (NFR-5). Bandwidth savings are expressed
    against a naive always-10s baseline, so healthy targets relaxing to
    30s-60s directly translate into conserved VPN/AVD tunnel bandwidth.
*/
const pollDistribution = { "10s": 0, "15s": 0, "30s": 0, "60s": 0 };

components.forEach(component => {
    const cadence = component.adaptivePoll.current;
    pollDistribution[cadence] = (pollDistribution[cadence] || 0) + 1;
});

const meanInterval = components.length
    ? round(
        Object.entries(pollDistribution).reduce(
            (sum, [cadence, count]) =>
                sum + parseInt(cadence, 10) * count,
            0
        ) / components.length,
        1
    )
    : 60;

const highFidelityTargets =
    (pollDistribution["10s"] || 0) + (pollDistribution["15s"] || 0);

const bandwidthSavingsPercent = Math.max(
    0,
    Math.round((1 - 10 / Math.max(10, meanInterval)) * 100)
);

const probeStatuses = components.map(
    component => component.diagnostics.lastProbe.status
);

const tunnelReachable = probeStatuses.filter(s => s === "ok").length;
const tunnelDegraded = probeStatuses.filter(s => s === "degraded").length;
const tunnelUnreachable = probeStatuses.filter(s => s === "unreachable").length;

const { history, suppressedTotal } = generateHistory(
    components,
    alerts,
    suppressedComponents.length
);

const series = generateSeries(history);

const data = {
    generatedAt: new Date().toISOString(),

    summary: {
        name: "Sentry_Ops",
        subtitle: "Hybrid Health & Resilience",
        environments: ["Azure", "On-Prem"],
        layers
    },

    components,

    alerts,

    correlations,

    series,

    config: {
        adaptivePolling: {
            enabled: true,
            mode: "Auto",
            rangeMin: 10,
            rangeMax: 60,
            label: "10s-60s",
            distribution: pollDistribution,
            highFidelityTargets,
            meanInterval,
            bandwidthSavingsPercent
        },
        transientFilter: {
            enabled: true,
            windowSeconds: 180,
            label: "<3m",
            active: true,
            suppressedToday: suppressedTotal,
            suppressed: suppressedComponents.map(component => ({
                component: component.name,
                layer: component.layer,
                metric: `${component.metricName} (${component.metricValue})`,
                silencedAt: component.transientFilter.suppressedSince
            }))
        },
        autoEscalation: {
            enabled: true,
            timerMinutes: 15,
            secondaryAlias: "oncall-secondary@sentry.local",
            active: alerts.length,
            escalated: escalatedCount
        },
        correlationEngine: {
            enabled: true,
            activeCorrelations: correlations.length,
            window: "15m"
        },
        tunnel: {
            transport: "VPN / AVD",
            reachable: tunnelReachable,
            degraded: tunnelDegraded,
            unreachable: tunnelUnreachable
        }
    },

    history,

    resilience: {
        rtoTarget: randomInt(45, 75),
        backupCoverage: randomInt(91, 99),
        lastRecovery: randomInt(30, 52),
        lastDrillPassed: true,
        backupSchedule: "Nightly 02:00 UTC",
        rpoTarget: randomInt(15, 45)
    }
};

const outputPath = path.join(__dirname, "..", "public", "data.json");

fs.writeFileSync(
    outputPath,
    JSON.stringify(data, null, 2)
);

console.log("=======================================");
console.log(" Sentry_Ops telemetry data generated");
console.log("=======================================");
console.log(`Components           : ${components.length}`);
console.log(`  Firing             : ${components.filter(c => c.status === "Firing").length}`);
console.log(`  Transient filtered : ${suppressedComponents.length}`);
console.log(`Incidents            : ${alerts.length}`);
console.log(`  Escalated          : ${escalatedCount}`);
console.log(`Correlations         : ${correlations.length}`);
console.log(`Adaptive poll        : ${JSON.stringify(pollDistribution)}`);
console.log(`  Mean interval      : ${meanInterval}s`);
console.log(`  Bandwidth saved    : ~${bandwidthSavingsPercent}%`);
console.log(`Tunnel reachability  : ${tunnelReachable} ok / ${tunnelDegraded} degraded / ${tunnelUnreachable} unreachable`);
console.log(`Suppressed today     : ${suppressedTotal}`);
console.log(`Metric series        : ${Object.keys(series).join(", ")}`);
console.log(`Generated            : ${data.generatedAt}`);
console.log(`Output               : ${outputPath}`);
console.log("=======================================");