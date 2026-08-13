import { useEffect, useMemo, useState } from "react";

import {
    Navbar,
    ArchitectureStrip,
    Filters,
    KpiCards,
    LayerHealth,
    MetricTrendPanel,
    ComponentCard,
    CorrelationPanel,
    IncidentCenter,
    Resilience,
    Registry,
    RegisterModal,
    ActionDrawer
} from "./components";

import {
    Shield
} from "lucide-react";

import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";

const LAYER_ORDER = ["Network", "Application", "Database", "Server"];

const layerThresholds = {
    Network: { key: "packetLoss", limit: 2 },
    Application: { key: "errorRate", limit: 1 },
    Database: { key: "latency", limit: 500 },
    Server: { key: "cpu", limit: 85 }
};

const layerFormats = {
    Network: value => `${value.toFixed(2)}%`,
    Application: value => `${value.toFixed(2)}%`,
    Database: value => `${Math.round(value)} ms`,
    Server: value => `${value.toFixed(1)}%`
};

function layerHealthNow(components) {
    const snapshot = {};

    LAYER_ORDER.forEach(layer => {
        const items = components.filter(c => c.layer === layer);
        const healthy = items.filter(c => c.status === "Healthy").length;

        snapshot[layer] = items.length
            ? Math.round((healthy / items.length) * 100)
            : 0;
    });

    return snapshot;
}

function numericLabel(cadence) {
    return cadence.replace("s", "");
}

function roundNumber(value, decimals = 1) {
    return Number(value.toFixed(decimals));
}

function formatMetricValue(value, unit) {
    if (value === null || value === undefined) return "—";
    return `${value} ${unit}`;
}

function parseMinsAgo(text) {
    const match = String(text).match(/(\d+) mins? ago/);
    return match ? parseInt(match[1], 10) : null;
}

function App() {
    const [data, setData] = useState(null);

    const [activeTab, setActiveTab] = useState("dashboard");
    const [role, setRole] = useState("All");
    const [layer, setLayer] = useState("all");
    const [environment, setEnvironment] = useState("all");

    const [components, setComponents] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [resilience, setResilience] = useState(null);
    const [history, setHistory] = useState([]);
    const [config, setConfig] = useState(null);
    const [correlations, setCorrelations] = useState([]);
    const [series, setSeries] = useState({});

    const [modalOpen, setModalOpen] = useState(false);
    const [drawerComponent, setDrawerComponent] = useState(null);

    /*
        Load generated telemetry.
    */
    useEffect(() => {
        fetch("/data.json")
            .then(response => response.json())
            .then(result => {
                setData(result);
                setComponents(result.components);
                setAlerts(result.alerts);
                setResilience(result.resilience);
                setHistory(result.history);
                setConfig(result.config);
                setCorrelations(result.correlations || []);
                setSeries(result.series || {});
            })
            .catch(error => {
                console.error("Unable to load monitoring data:", error);
            });
    }, []);

    /*
        Simulate live monitoring with adaptive polling cadence.
        Firing targets are re-probed at 10s; healthy targets relax
        back to their base cadence inside the 10s-60s band.
    */
    useEffect(() => {
        const interval = setInterval(() => {
            setComponents(previous =>
                previous.map(component => simulateMetric(component))
            );
        }, 20000);

        return () => clearInterval(interval);
    }, []);

    function simulateMetric(component) {
        const metrics = { ...component.metrics };

        if (component.layer === "Server") {
            metrics.cpu = clamp(metrics.cpu + randomChange(4), 5, 99);
            metrics.memory = clamp(metrics.memory + randomChange(3), 10, 98);
            metrics.disk = clamp(metrics.disk + randomChange(1), 20, 98);
        } else if (component.layer === "Database") {
            metrics.latency = Math.max(20, metrics.latency + randomChange(60));
        } else if (component.layer === "Application") {
            metrics.errorRate = clamp(
                metrics.errorRate + randomChange(0.2),
                0,
                5
            );
        } else {
            metrics.packetLoss = clamp(
                metrics.packetLoss + randomChange(0.5),
                0,
                8
            );
        }

        const state = layerThresholds[component.layer];
        const value = metrics[state.key];
        const nowFiring = value > state.limit;

        const baseSeconds = Math.max(
            10,
            Math.min(60, parseInt(component.baseInterval || component.interval, 10) || 30)
        );

        const current = nowFiring ? "10s" : `${baseSeconds}s`;

        return {
            ...component,
            metrics,
            metricValue: layerFormats[component.layer](value),
            status: nowFiring ? "Firing" : "Healthy",
            alertState: nowFiring ? "Firing" : "Normal",
            adaptivePoll: {
                ...component.adaptivePoll,
                current,
                rationale: nowFiring
                    ? "Firing — poll tightened to 10s for faster recovery signal."
                    : "Healthy — polling at base cadence inside 10s-60s band."
            }
        };
    }

    function randomChange(max) {
        return Math.random() * max * 2 - max;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    const filteredComponents = useMemo(() => {
        return components.filter(component => {
            const layerMatch =
                layer === "all" || component.layer === layer;

            const environmentMatch =
                environment === "all" ||
                component.environment === environment;

            return layerMatch && environmentMatch;
        });
    }, [components, layer, environment]);

    const escalatedCount = alerts.filter(
        alert => alert.escalation?.escalated
    ).length;

    const liveConfig = useMemo(() => {
        if (!config) return null;

        return {
            ...config,
            adaptivePolling: {
                ...config.adaptivePolling,
                activeTargets: components.filter(
                    c => c.adaptivePoll?.current === "10s"
                ).length
            },
            autoEscalation: {
                ...config.autoEscalation,
                active: alerts.length,
                escalated: escalatedCount
            },
            correlationEngine: {
                ...config.correlationEngine,
                activeCorrelations: correlations.length
            }
        };
    }, [config, components, alerts, correlations, escalatedCount]);

    const liveSeries = useMemo(() => {
        const mean = (layerName, metricKey) => {
            const items = components.filter(
                c =>
                    c.layer === layerName &&
                    c.metrics?.[metricKey] !== undefined
            );

            if (items.length === 0) return null;

            return (
                items.reduce(
                    (sum, c) => sum + c.metrics[metricKey],
                    0
                ) / items.length
            );
        };

        const withTrend = (key, current) => {
            const meta = series[key] || {};
            const points = meta.points || [];

            let delta = null;
            if (points.length >= 2) {
                delta = roundNumber(
                    points[points.length - 1].value -
                        points[points.length - 2].value,
                    2
                );
            }

            return {
                key,
                label: meta.label || key,
                layer: meta.layer || "",
                unit: meta.unit || "",
                threshold: meta.threshold ?? null,
                window: meta.window || "2h",
                points,
                current: current ?? points[points.length - 1]?.value ?? null,
                delta
            };
        };

        return {
            dbQueryLatency: withTrend(
                "dbQueryLatency",
                mean("Database", "latency")
            ),
            dbPoolUtilization: withTrend(
                "dbPoolUtilization",
                mean("Database", "poolUtilization")
            ),
            appErrorRate: withTrend(
                "appErrorRate",
                mean("Application", "errorRate")
            ),
            appResponseTime: withTrend(
                "appResponseTime",
                mean("Application", "responseTime")
            ),
            appRequestRate: withTrend(
                "appRequestRate",
                mean("Application", "requestRate")
            ),
            networkPacketLoss: withTrend(
                "networkPacketLoss",
                mean("Network", "packetLoss")
            ),
            networkLatency: withTrend(
                "networkLatency",
                mean("Network", "latency")
            ),
            serverCpu: withTrend("serverCpu", mean("Server", "cpu"))
        };
    }, [components, series]);

    const stats = useMemo(() => {
        const firingCount = components.filter(
            c => c.status === "Firing"
        ).length;

        const healthyCount = components.length - firingCount;
        const perLayer = layerHealthNow(components);

        const overallHealth = components.length
            ? Math.round(
                LAYER_ORDER.reduce(
                    (sum, layer) => sum + perLayer[layer],
                    0
                ) / LAYER_ORDER.length
            )
            : 0;

        const priorityCount = alerts.filter(
            alert => alert.severity === "Critical" || alert.severity === "High"
        ).length;

        const suppressedToday =
            config?.transientFilter?.suppressedToday ?? 0;

        const noiseEliminatedPercent =
            alerts.length === 0
                ? 100
                : Math.round(
                    (suppressedToday / (suppressedToday + alerts.length)) * 100
                );

        const ages = alerts
            .map(alert => parseMinsAgo(alert.time))
            .filter(value => value !== null)
            .sort((a, b) => a - b);

        const medianAlertAge = ages.length
            ? ages[Math.floor(ages.length / 2)]
            : 0;

        const last = history[history.length - 1];
        const prior = history[history.length - 2];
        const healthTrend = history.length >= 2
            ? last.health - prior.health
            : 0;

        const rtoOnTarget =
            resilience && resilience.lastRecovery <= resilience.rtoTarget;

        const meanInterval =
            config?.adaptivePolling?.meanInterval ?? null;

        const bandwidthSavings =
            config?.adaptivePolling?.bandwidthSavingsPercent ?? 0;

        const correlatedComponents = new Set();
        correlations.forEach(chain => {
            if (chain?.root?.component) {
                correlatedComponents.add(chain.root.component);
            }
            (chain?.affected || []).forEach(item => {
                if (item?.component) {
                    correlatedComponents.add(item.component);
                }
            });
        });

        const correlatedIncidents = alerts.filter(alert =>
            correlatedComponents.has(alert.component)
        ).length;

        const correlationCoverage = alerts.length
            ? Math.round((correlatedIncidents / alerts.length) * 100)
            : 0;

        return {
            overallHealth,
            perLayer,
            firingCount,
            healthyCount,
            monitoredTargets: components.length,
            activeIncidents: alerts.length,
            priorityCount,
            suppressedToday,
            noiseEliminatedPercent,
            medianAlertAge,
            healthTrend,
            rtoDrill: resilience?.lastRecovery,
            rtoTarget: resilience?.rtoTarget,
            rtoOnTarget,
            meanInterval,
            bandwidthSavings,
            escalated: escalatedCount,
            correlationCount: correlations.length,
            correlationWindow:
                config?.correlationEngine?.window ?? "15m",
            correlationCoverage,
            avgDbLatency: liveSeries.dbQueryLatency,
            appErrorRate: liveSeries.appErrorRate
        };
    }, [
        components,
        alerts,
        config,
        history,
        resilience,
        correlations,
        liveSeries,
        escalatedCount
    ]);

    function toggleComponentAlert(id) {
        setComponents(previous =>
            previous.map(component => {
                if (component.id !== id) return component;

                const firing = component.alertState !== "Firing";

                return {
                    ...component,
                    alertState: firing ? "Firing" : "Normal",
                    status: firing ? "Firing" : "Healthy",
                    adaptivePoll: {
                        ...component.adaptivePoll,
                        current: firing ? "10s" : component.adaptivePoll.current
                    }
                };
            })
        );

        const component = components.find(c => c.id === id);
        if (!component) return;

        const exists = alerts.some(a => a.component === component.name);

        if (exists) {
            setAlerts(previous =>
                previous.filter(alert => alert.component !== component.name)
            );
        } else {
            const correlation = correlations.find(
                chain =>
                    chain.root.component === component.name ||
                    chain.affected.some(a => a.component === component.name)
            );

            setAlerts(previous => [
                ...previous,
                {
                    id: Date.now(),
                    component: component.name,
                    layer: component.layer,
                    environment: component.environment,
                    metric: `${component.metricName} (${component.metricValue})`,
                    summary: `${component.metricName} above ${component.threshold} threshold.`,
                    time: "just now",
                    state: "Firing",
                    status: "Firing",
                    severity: component.severity || "High",
                    alertState: "Firing",
                    alias: component.team,
                    transientFiltered: false,
                    escalation: {
                        enabled: true,
                        timer: "15m",
                        timerSeconds: 900,
                        remainingSeconds: 900,
                        remaining: "15m",
                        escalated: false,
                        secondaryAlias:
                            component.autoEscalation?.secondaryAlias ||
                            "oncall-secondary@sentry.local"
                    },
                    correlation: correlation
                        ? correlation.narrative
                        : "Isolated — no cross-layer relationship detected."
                }
            ]);
        }
    }

    function testIncident() {
        if (components.length === 0) return;

        const target =
            components.find(c => c.alertState !== "Firing") ||
            components[0];

        toggleComponentAlert(target.id);
    }

    function acknowledgeAlert(id) {
        setAlerts(previous =>
            previous.map(alert =>
                alert.id === id
                    ? {
                          ...alert,
                          status: "Acknowledged",
                          time: "acknowledged just now"
                      }
                    : alert
            )
        );
    }

    function resolveAlert(id) {
        const alert = alerts.find(a => a.id === id);
        if (!alert) return;

        setComponents(previous =>
            previous.map(component =>
                component.name === alert.component
                    ? {
                          ...component,
                          status: "Healthy",
                          alertState: "Normal",
                          adaptivePoll: {
                              ...component.adaptivePoll,
                              current: "30s"
                          }
                      }
                    : component
            )
        );

        setAlerts(previous =>
            previous.filter(a => a.id !== id)
        );
    }

    function addComponent(formData) {
        const newComponent = {
            id: Date.now(),
            name: formData.name,
            layer: formData.layer,
            environment: formData.environment,
            endpoint: formData.endpoint,
            probeType: formData.probeType,
            interval: formData.interval,
            baseInterval: formData.interval,
            status: "Healthy",
            alertState: "Normal",
            severity: "Low",
            team: `${formData.layer.toLowerCase()}-team@sentry.local`,
            metricName:
                formData.layer === "Network" ? "Packet Loss" : "Status Probe",
            metricValue:
                formData.layer === "Network" ? "0.1%" : "OK",
            threshold:
                formData.layer === "Network" ? "2.0%" : "N/A",
            metrics: {
                cpu: 40,
                memory: 50,
                disk: 30,
                latency: 100,
                responseTime: 120,
                errorRate: 0.1,
                packetLoss: 0.1,
                bandwidth: 1,
                availability: 99.9,
                connections: 40,
                storage: 40
            },
            adaptivePoll: {
                enabled: true,
                mode: "Auto",
                rangeMin: 10,
                rangeMax: 60,
                current: formData.interval,
                base: formData.interval,
                rationale: "Newly registered — polling at base cadence."
            },
            transientFilter: {
                enabled: true,
                window: "<3m",
                active: true,
                suppressed: false,
                suppressedSince: null,
                autoRetestIn: null
            },
            autoEscalation: {
                enabled: true,
                timer: "15m",
                timerSeconds: 900,
                remaining: null,
                status: "Idle",
                secondaryAlias: "oncall-secondary@sentry.local"
            },
            correlation: {
                summary: "No active cascade anomalies detected for this target.",
                role: "Stable",
                relatedLayers: []
            },
            diagnostics: {
                probeType: formData.probeType,
                lastProbe: {
                    status: "ok",
                    rtt: "12ms",
                    packetLoss: "0.0%",
                    performedAt: "just now"
                }
            },
            registeredAt: new Date().toISOString().slice(0, 10)
        };

        setComponents(previous => [...previous, newComponent]);
        setModalOpen(false);
    }

    function deleteComponent(id) {
        setComponents(previous =>
            previous.filter(component => component.id !== id)
        );

        setAlerts(previous =>
            previous.filter(alert => alert.component !==
                components.find(c => c.id === id)?.name)
        );
    }

    function saveDrawer(id) {
        setComponents(previous =>
            previous.map(component =>
                component.id === id
                    ? {
                          ...component,
                          status: "Healthy",
                          alertState: "Normal",
                          adaptivePoll: {
                              ...component.adaptivePoll,
                              current: "30s"
                          }
                      }
                    : component
            )
        );

        const component = components.find(c => c.id === id);
        if (component) {
            setAlerts(previous =>
                previous.filter(alert => alert.component !== component.name)
            );
        }

        setDrawerComponent(null);
    }

    if (!data) {
        return (
            <div className="loading-screen">
                <div className="loading-logo">S</div>
                <h2>Loading Sentry_Ops</h2>
                <p>Loading monitoring telemetry...</p>
            </div>
        );
    }

    return (
        <div className="app">

            <Navbar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                alertCount={alerts.length}
                escalatedCount={escalatedCount}
                config={liveConfig}
            />

            <main className="main">

                <ArchitectureStrip
                    setLayer={setLayer}
                    config={liveConfig}
                />

                <Filters
                    role={role}
                    setRole={setRole}
                    layer={layer}
                    setLayer={setLayer}
                    environment={environment}
                    setEnvironment={setEnvironment}
                    onTestIncident={testIncident}
                />

                <KpiCards stats={stats} />

                {activeTab === "dashboard" && (
                    <Dashboard
                        components={filteredComponents}
                        allComponents={components}
                        history={history}
                        series={liveSeries}
                        correlations={correlations}
                        setLayer={setLayer}
                        alerts={alerts}
                        resilience={resilience}
                        config={liveConfig}
                        stats={stats}
                        onToggleAlert={toggleComponentAlert}
                        onOpenDrawer={setDrawerComponent}
                        setActiveTab={setActiveTab}
                    />
                )}

                {activeTab === "components" && (
                    <Registry
                        components={components}
                        onDelete={deleteComponent}
                        onOpenModal={() => setModalOpen(true)}
                    />
                )}

                {activeTab === "alerts" && (
                    <IncidentCenter
                        alerts={alerts}
                        onAcknowledge={acknowledgeAlert}
                        onResolve={resolveAlert}
                        config={liveConfig}
                        stats={stats}
                    />
                )}

                {activeTab === "resilience" && (
                    <Resilience
                        resilience={resilience}
                    />
                )}

            </main>

            <RegisterModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={addComponent}
            />

            <ActionDrawer
                component={drawerComponent}
                onClose={() => setDrawerComponent(null)}
                onSave={saveDrawer}
            />

        </div>
    );
}

function Dashboard({
    components,
    allComponents,
    history,
    series,
    correlations,
    setLayer,
    alerts,
    resilience,
    config,
    stats,
    onToggleAlert,
    onOpenDrawer,
    setActiveTab
}) {
    const escalationRemaining = config?.autoEscalation?.active
        ? Math.min(
            1,
            alerts.reduce(
                (sum, alert) =>
                    sum + (alert.escalation?.remainingSeconds ?? 0),
                0
            ) /
                (config.autoEscalation.active * 15 * 60)
        )
        : 1;

    const escalationProgress = Math.round(escalationRemaining * 100);

    const rtoProgress = resilience?.rtoTarget
        ? Math.min(
            100,
            Math.round(
                (resilience.lastRecovery / resilience.rtoTarget) * 100
            )
        )
        : 0;

    const pollDistributionData =
        Object.entries(config?.adaptivePolling?.distribution || {}).map(
            ([cadence, count]) => ({
                cadence,
                count,
                label: numericLabel(cadence)
            })
        );

    const correlationHeadline =
        correlations.length > 0
            ? correlations[0].root.layer +
              " " +
              correlations[0].root.metric.split(" ")[0] +
              " correlated with " +
              correlations[0].affected.map(a => a.layer).join(" → ") +
              "."
            : "No active cascade anomalies detected.";

    return (
        <div className="dashboard">

            <div className="dashboard-grid">

                <section className="panel">

                    <div className="panel-header">

                        <div>
                            <h2>Layer Health & Cross-Layer Correlation</h2>
                            <p>
                                Health is the share of monitored targets
                                reporting Healthy per layer. Each card lists the
                                fleet count, firing targets, the layer's primary
                                metric against its limit, and the change over
                                the last five-minute period.
                            </p>
                        </div>

                        <span className="last-updated">
                            <span className="pulse-dot" />
                            Updated just now
                        </span>

                    </div>

                    <div className="panel-summary-strip">
                        <span>
                            {allComponents.length} monitored targets
                        </span>
                        <span>
                            {allComponents.filter(
                                c => c.status === "Firing"
                            ).length}{" "}
                            firing
                        </span>
                        <span>
                            {correlations.length} active cascade
                            {correlations.length === 1 ? "" : "s"}
                        </span>
                        <span className="strip-link">
                            Above limit → cross-layer correlation below
                        </span>
                    </div>

                    <LayerHealth
                        components={allComponents}
                        correlations={correlations}
                        setLayer={setLayer}
                        history={history}
                    />

                </section>

                <aside className="resilience-panel">

                    <div className="resilience-title">

                        <div>
                            <small>SMART ROUTING & ESCALATION</small>
                            <h3>Incident readiness</h3>
                        </div>

                        <Shield size={20} />
                    </div>

                    <div className="resilience-metric">

                        <div>
                            <span>Transient Silencing</span>
                            <strong>
                                {stats.noiseEliminatedPercent}% noise eliminated
                            </strong>
                        </div>

                        <div className="dark-progress">
                            <div
                                className="green"
                                style={{
                                    width: `${stats.noiseEliminatedPercent}%`
                                }}
                            />
                        </div>

                    </div>

                    <div className="resilience-metric">

                        <div>
                            <span>Auto-Escalation Timer</span>
                            <strong>
                                {config?.autoEscalation?.timerMinutes ?? 15} min
                            </strong>
                        </div>

                        <div className="dark-progress">
                            <div
                                className={
                                    escalationProgress < 35 ? "orange" : "green"
                                }
                                style={{ width: `${escalationProgress}%` }}
                            />
                        </div>

                    </div>

                    <div className="resilience-metric">

                        <div>
                            <span>RTO</span>
                            <strong>
                                {resilience.lastRecovery} min{" "}
                                <small>
                                    of {resilience.rtoTarget} min target
                                </small>
                            </strong>
                        </div>

                        <div className="dark-progress">
                            <div
                                className={
                                    rtoProgress >= 100 ? "orange" : "green"
                                }
                                style={{ width: `${rtoProgress}%` }}
                            />
                        </div>

                    </div>

                    <div className="resilience-metric">

                        <div>
                            <span>Backup coverage</span>
                            <strong>{resilience.backupCoverage}%</strong>
                        </div>

                        <div className="dark-progress">
                            <div
                                className="green"
                                style={{ width: `${resilience.backupCoverage}%` }}
                            />
                        </div>

                    </div>

                    <div className="status-line">

                        <small>CORRELATION ENGINE STATUS</small>

                        <p className="orange">{correlationHeadline}</p>

                        <p>
                            {alerts.length} incident{alerts.length === 1 ? "" : "s"}{" "}
                            routed across{" "}
                            {new Set(alerts.map(a => a.alias)).size || 0} on-call
                            aliases.
                        </p>

                        {config?.tunnel && (
                            <p className="status-line-meta">
                                Tunnel:{" "}
                                {config.tunnel.reachable} reachable ·{" "}
                                {config.tunnel.degraded} degraded ·{" "}
                                {config.tunnel.unreachable} unreachable
                                <span className="muted-inline">
                                    {" "}({config.tunnel.transport})
                                </span>
                            </p>
                        )}

                    </div>

                    <div className="recommendation">

                        <small>RECOMMENDED NEXT ACTION</small>

                        <p>
                            Validate the recovery runbook for any active
                            infrastructure incident.
                        </p>

                        <button
                            className="panel-link"
                            onClick={() => setActiveTab("resilience")}
                        >
                            Open recovery plan
                        </button>

                    </div>

                </aside>

            </div>

            <CorrelationPanel correlations={correlations} />

            <div className="charts-grid">

                <section className="chart-panel">

                    <div className="chart-heading">

                        <div>
                            <div className="chart-kicker">All layers</div>
                            <h3>Layer Health</h3>
                            <p>
                                Per-layer healthy-target share over the last two
                                hours. Each line converges on the live layer
                                summary above; the orange line is the fleet
                                average.
                            </p>
                        </div>

                        <div className="chart-current">
                            <span className="chart-current-label">
                                Fleet health
                            </span>

                            <span className="chart-current-value">
                                {stats.overallHealth}%
                            </span>

                            <span
                                className={`chart-delta ${
                                    stats.healthTrend > 0
                                        ? "delta-up"
                                        : "delta-down"
                                }`}
                            >
                                {stats.healthTrend > 0 ? "+" : ""}
                                {stats.healthTrend}% in period
                            </span>
                        </div>

                    </div>

                    <div className="chart-params">
                        <span>Units: % healthy</span>
                        <span>Window: 2h</span>
                        <span>Update: 20 s</span>
                        <span>Breach line: 90%</span>
                    </div>

                    <ResponsiveContainer width="100%" height={220}>
                        <ComposedChart
                            data={history}
                            margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#eeeeee"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={28}
                            />
                            <YAxis
                                domain={[40, 100]}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                tickLine={false}
                                axisLine={false}
                                width={40}
                            />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line
                                type="monotone"
                                dataKey="Network"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="Application"
                                stroke="#8B5CF6"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="Database"
                                stroke="#F59E0B"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="Server"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="health"
                                stroke="#FF6B00"
                                strokeWidth={2.5}
                                dot={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>

                </section>

                <MetricTrendPanel
                    title="Query Latency"
                    description="Fleet-average latency from SQL probes. Spikes track Database-layer health dips in the status strip and drive the 500 ms alert threshold."
                    layer="Database"
                    unit="ms"
                    window="2h"
                    update="10–60 s adaptive"
                    current={series.dbQueryLatency.current}
                    delta={series.dbQueryLatency.delta}
                    threshold={series.dbQueryLatency.threshold}
                    points={series.dbQueryLatency.points}
                    color="#F59E0B"
                    currentFormatter={value =>
                        formatMetricValue(value, "ms")
                    }
                />

                <MetricTrendPanel
                    title="App Error Rate"
                    description="Share of requests returning errors across monitored application endpoints. Correlated with response-time elevation when Network or Server cascades propagate."
                    layer="Application"
                    unit="%"
                    window="2h"
                    update="10–60 s adaptive"
                    current={series.appErrorRate.current}
                    delta={series.appErrorRate.delta}
                    threshold={series.appErrorRate.threshold}
                    points={series.appErrorRate.points}
                    color="#EF4444"
                    currentFormatter={value =>
                        formatMetricValue(value, "%")
                    }
                />

                <MetricTrendPanel
                    title="Packet Loss"
                    description="SNMP-measured packet loss across Azure and on-prem segments. Readings above 2% flag switching-path or tunnel degradation over VPN/AVD."
                    layer="Network"
                    unit="%"
                    window="2h"
                    update="10–60 s adaptive"
                    current={series.networkPacketLoss.current}
                    delta={series.networkPacketLoss.delta}
                    threshold={series.networkPacketLoss.threshold}
                    points={series.networkPacketLoss.points}
                    color="#3B82F6"
                    currentFormatter={value =>
                        formatMetricValue(value, "%")
                    }
                />

                <MetricTrendPanel
                    title="Server CPU"
                    description="Average CPU utilization across registered server targets. Sustained saturation above 80% is the leading predictor of response-time cascades into Application and Database layers."
                    layer="Server"
                    unit="%"
                    window="2h"
                    update="10–60 s adaptive"
                    current={series.serverCpu.current}
                    delta={series.serverCpu.delta}
                    threshold={series.serverCpu.threshold}
                    points={series.serverCpu.points}
                    color="#10B981"
                    currentFormatter={value =>
                        formatMetricValue(value, "%")
                    }
                />

                <section className="chart-panel">

                    <div className="chart-heading">

                        <div>
                            <div className="chart-kicker">
                                NFR-5 · adaptive polling
                            </div>
                            <h3>Adaptive Poll Cadence</h3>
                            <p>
                                Count of monitored targets per cadence. Firing
                                targets accelerate to 10–15 s for high-fidelity
                                diagnostics; healthy targets relax toward the
                                60 s baseline to conserve tunnel bandwidth.
                            </p>
                        </div>

                        <div className="chart-current">
                            <span className="chart-current-label">
                                Mean cadence
                            </span>

                            <span className="chart-current-value">
                                {stats.meanInterval}s
                            </span>

                            <span className="chart-delta delta-down">
                                −{config?.adaptivePolling?.bandwidthSavingsPercent ?? 0}% bandwidth
                            </span>
                        </div>

                    </div>

                    <div className="chart-params">
                        <span>Units: targets</span>
                        <span>State: live</span>
                        <span>Update: 20 s</span>
                        <span>Range: 10–60 s</span>
                    </div>

                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart
                            data={pollDistributionData}
                            margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#eeeeee"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 10, fill: "#6b7280" }}
                                tickLine={false}
                                axisLine={false}
                                width={36}
                            />
                            <Tooltip cursor={{ fill: "#fafafa" }} />
                            <Bar
                                dataKey="count"
                                fill="#FF6B00"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>

                </section>

            </div>

            <section className="components-section">

                <div className="section-heading">

                    <div>
                        <h2>Monitored Components</h2>
                        <p>
                            Click any card to open the diagnostic action drawer.
                        </p>
                    </div>

                    <span>Adaptive poll (10s-60s)</span>

                </div>

                <div className="components-grid">

                    {components.map(component => (
                        <ComponentCard
                            key={component.id}
                            component={component}
                            onToggleAlert={onToggleAlert}
                            onOpenDrawer={onOpenDrawer}
                        />
                    ))}

                </div>

            </section>

        </div>
    );
}

export default App;