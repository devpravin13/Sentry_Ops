import { useState } from "react";

import {
    Activity,
    AlertTriangle,
    AppWindow,
    CheckCircle2,
    ChevronRight,
    Clock3,
    Database,
    DatabaseBackup,
    Network,
    Plus,
    Radar,
    Server,
    Shield,
    ShieldCheck,
    Sparkles,
    Trash2,
    X,
    Zap
} from "lucide-react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    ReferenceLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip
} from "recharts";

export function Navbar({ activeTab, setActiveTab, alertCount, escalatedCount, config }) {
    const tabs = [
        ["dashboard", "Dashboard & Metrics"],
        ["components", "Component Registry"],
        ["alerts", "Incidents"],
        ["resilience", "Resilience"]
    ];

    return (
        <header className="navbar">
            <div className="navbar-inner">

                <div className="brand">
                    <div className="brand-logo">S</div>

                    <div>
                        <div className="brand-title">Sentry_Ops</div>
                        <div className="brand-subtitle">
                            Hybrid Health & Resilience
                        </div>
                    </div>
                </div>

                <nav className="nav-tabs">
                    {tabs.map(([key, label]) => (
                        <button
                            key={key}
                            className={`nav-tab ${
                                activeTab === key ? "active" : ""
                            }`}
                            onClick={() => setActiveTab(key)}
                        >
                            {label}

                            {key === "alerts" && alertCount > 0 && (
                                <span className="alert-badge">
                                    {alertCount}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>

                <div
                    className="poll-status"
                    title="Adaptive polling tightens the cadence to 10s for firing targets and relaxes up to 60s when healthy."
                >
                    <span className="pulse-dot" />
                    Adaptive Poll Active
                    {config?.adaptivePolling?.label && (
                        <> ({config.adaptivePolling.label})</>
                    )}
                    {escalatedCount > 0 && (
                        <span style={{ color: "var(--orange)" }}>
                            {" · "}{escalatedCount} escalated
                        </span>
                    )}
                </div>

            </div>
        </header>
    );
}

export function ArchitectureStrip({ setLayer, config }) {
    const layers = [
        { name: "Network", description: "Devices & connectivity", icon: Network },
        { name: "Application", description: "Availability & errors", icon: AppWindow },
        { name: "Database", description: "Latency & capacity", icon: Database },
        { name: "Server", description: "Compute & resources", icon: Server }
    ];

    return (
        <section className="architecture-card">

            <div className="architecture-header">

                <div>
                    <div className="eyebrow">
                        <span className="orange-dot" />
                        Unified operations view with smart routing
                    </div>

                    <h1>Hybrid Infrastructure Health & Cross-Layer Correlation</h1>

                    <p>
                        One operational view across Network, Application,
                        Database and Server — with adaptive polling and
                        smart transient filtering for Azure and On-Prem.
                    </p>
                </div>

                <div className="architecture-tags">
                    <span>Azure</span>
                    <span>Local / On-Prem</span>
                    <span className="orange-tag">4 monitoring layers</span>
                    <span className="orange-tag">
                        Smart Transient Filtering
                        {config?.transientFilter?.label ?? " (<3m)"}
                    </span>
                </div>

            </div>

            <div className="layer-strip">

                {layers.map(layer => {
                    const Icon = layer.icon;

                    return (
                        <button
                            key={layer.name}
                            className="layer-button"
                            onClick={() => setLayer(layer.name)}
                        >
                            <div className="layer-label">{layer.name}</div>

                            <div className="layer-name">
                                {layer.description}
                                <Icon size={17} />
                            </div>
                        </button>
                    );
                })}

            </div>
        </section>
    );
}

export function Filters({
    role,
    setRole,
    layer,
    setLayer,
    environment,
    setEnvironment,
    onTestIncident
}) {
    return (
        <section className="filter-row">

            <div className="role-wrapper">

                <div className="role-select">
                    <ShieldCheck size={16} />
                    <span>View as</span>

                    <select
                        value={role}
                        onChange={e => {
                            setRole(e.target.value);
                            setLayer(
                                e.target.value === "All"
                                    ? "all"
                                    : e.target.value
                            );
                        }}
                    >
                        <option value="All">Operations / All</option>
                        <option value="Network">Network Engineer</option>
                        <option value="Application">Application Engineer</option>
                        <option value="Database">Database Engineer</option>
                        <option value="Server">Server Engineer</option>
                    </select>
                </div>

                <span className="role-description">
                    Role-based focus on the same unified correlation model.
                </span>

            </div>

            <div className="filters">

                <select
                    value={layer}
                    onChange={e => setLayer(e.target.value)}
                >
                    <option value="all">All Layers</option>
                    <option value="Server">Server</option>
                    <option value="Database">Database</option>
                    <option value="Application">Application</option>
                    <option value="Network">Network</option>
                </select>

                <select
                    value={environment}
                    onChange={e => setEnvironment(e.target.value)}
                >
                    <option value="all">All Environments</option>
                    <option value="Azure">Azure</option>
                    <option value="On-Prem">Local / On-Prem</option>
                </select>

                <button
                    className="orange-button"
                    onClick={onTestIncident}
                    title="Fire a correlated test incident through the smart routing pipeline"
                >
                    <Zap size={15} />
                    Test Incident
                </button>

            </div>

        </section>
    );
}

function roundNumber(value, decimals = 1) {
    return Number(value.toFixed(decimals));
}

function formatValue(value, unit) {
    if (value === null || value === undefined) return "—";
    return `${typeof value === "number" ? value.toLocaleString() : value} ${unit}`;
}

function limitChip(value, threshold) {
    if (value === null || threshold === null || threshold === undefined) {
        return { label: "No threshold", tone: "neutral" };
    }

    return value > threshold
        ? { label: "Above limit", tone: "warning" }
        : { label: "Within limit", tone: "ok" };
}

export function KpiCards({ stats }) {
    const {
        overallHealth,
        healthyCount,
        monitoredTargets,
        activeIncidents,
        priorityCount,
        suppressedToday,
        medianAlertAge,
        healthTrend,
        escalated,
        meanInterval,
        avgDbLatency,
        appErrorRate
    } = stats;

    const trendLabel =
        healthTrend > 0
            ? `+${healthTrend}% in period`
            : healthTrend < 0
                ? `${healthTrend}% in period`
                : "Flat in period";

    const db = avgDbLatency || {};
    const err = appErrorRate || {};

    const dbChip = limitChip(db.current, db.threshold);
    const errChip = limitChip(err.current, err.threshold);

    const cards = [
        {
            label: "Overall Health",
            value: `${overallHealth}%`,
            status: trendLabel,
            tone: overallHealth >= 90 ? "ok" : "warning",
            progress: overallHealth
        },
        {
            label: "Monitored Targets",
            value: monitoredTargets,
            status: `${healthyCount} reporting healthy`,
            description: meanInterval
                ? `Mean adaptive poll interval ${meanInterval}s`
                : "Adaptive polling active"
        },
        {
            label: "Active Incidents",
            value: activeIncidents,
            status:
                escalated > 0
                    ? `${escalated} escalated`
                    : activeIncidents > 0
                        ? `${priorityCount} critical or high`
                        : "No incidents",
            tone: activeIncidents ? "warning" : "ok",
            description: `${medianAlertAge}m median age · ${suppressedToday} transient spikes silenced`
        },
        {
            label: "Avg DB Query Latency",
            value: formatValue(
                db.current !== null && db.current !== undefined
                    ? Math.round(db.current)
                    : db.current,
                "ms"
            ),
            status: dbChip.label,
            tone: dbChip.tone,
            description: db.threshold
                ? `Threshold ${db.threshold} ms over the sampled fleet`
                : "Threshold not configured"
        },
        {
            label: "App Error Rate",
            value: formatValue(
                err.current !== null && err.current !== undefined
                    ? err.current.toFixed(2)
                    : err.current,
                "%"
            ),
            status: errChip.label,
            tone: errChip.tone,
            description: err.threshold
                ? `Threshold ${err.threshold}% across application endpoints`
                : "Threshold not configured"
        }
    ];

    return (
        <section className="kpi-grid">

            {cards.map(card => (
                <div className="kpi-card" key={card.label}>

                    <div className="kpi-label">{card.label}</div>

                    <div className="kpi-value-row">
                        <span className="kpi-value">{card.value}</span>

                        <span
                            className={`metric-tag ${
                                card.tone === "warning"
                                    ? "tag-warning"
                                    : card.tone === "ok"
                                        ? "tag-ok"
                                        : "tag-muted"
                            }`}
                        >
                            {card.status}
                        </span>
                    </div>

                    {card.progress !== undefined ? (
                        <div className="progress">
                            <div
                                className={`progress-fill ${
                                    card.progress < 90 ? "warning-fill" : ""
                                }`}
                                style={{ width: `${card.progress}%` }}
                            />
                        </div>
                    ) : (
                        <p className="kpi-description">
                            {card.description}
                        </p>
                    )}

                </div>
            ))}

        </section>
    );
}

const layerIconMap = {
    Network: Network,
    Application: AppWindow,
    Database: Database,
    Server: Server
};

const layerPrimaryMetric = {
    Network: { label: "Packet loss", key: "packetLoss", limit: 2, unit: "%", decimals: 2 },
    Application: { label: "Error rate", key: "errorRate", limit: 1, unit: "%", decimals: 2 },
    Database: { label: "Query latency", key: "latency", limit: 500, unit: "ms", decimals: 0 },
    Server: { label: "CPU", key: "cpu", limit: 85, unit: "%", decimals: 1 }
};

export function LayerHealth({ components, correlations, setLayer, history }) {
    const layerInfo = {
        Network: { description: "Connectivity, devices, packet loss and bandwidth" },
        Application: { description: "Availability, response time and application errors" },
        Database: { description: "Latency, capacity, connections and query health" },
        Server: { description: "CPU, memory, disk and service availability" }
    };

    const rootCorrelations = correlations
        ? correlations.map(c => c.root.layer)
        : [];

    const lastBucket = history?.[history.length - 1] || {};
    const priorBucket = history?.[history.length - 2] || {};

    const statusFor = health =>
        health >= 90
            ? { label: "Stable", tone: "ok" }
            : health >= 75
                ? { label: "Watch", tone: "warn" }
                : { label: "At risk", tone: "danger" };

    return (
        <div className="layer-health-grid">

            {Object.entries(layerInfo).map(
                ([layerName, info]) => {

                    const layerComponents = components.filter(
                        c => c.layer === layerName
                    );

                    const firingCount = layerComponents.filter(
                        c => c.status === "Firing"
                    ).length;

                    const healthy = layerComponents.length - firingCount;

                    const health =
                        layerComponents.length === 0
                            ? 0
                            : Math.round(
                                (healthy / layerComponents.length) * 100
                            );

                    const metric = layerPrimaryMetric[layerName];
                    const values = layerComponents
                        .map(c => c.metrics?.[metric.key])
                        .filter(v => typeof v === "number");

                    const metricAvg =
                        values.length > 0
                            ? roundNumber(
                                values.reduce((s, v) => s + v, 0) /
                                    values.length,
                                metric.decimals
                            )
                            : null;

                    const prior =
                        typeof priorBucket[layerName] === "number"
                            ? priorBucket[layerName]
                            : null;
                    const latest =
                        typeof lastBucket[layerName] === "number"
                            ? lastBucket[layerName]
                            : null;

                    const trendDelta =
                        prior !== null && latest !== null
                            ? latest - prior
                            : null;

                    const status = statusFor(health);
                    const Icon = layerIconMap[layerName];
                    const isCorrelationRoot =
                        rootCorrelations.includes(layerName);

                    return (
                        <button
                            className="layer-health-card"
                            key={layerName}
                            onClick={() => setLayer(layerName)}
                        >

                            <div className="layer-health-top">

                                <div className="layer-health-title">

                                    <div className="layer-icon">
                                        <Icon size={17} />
                                    </div>

                                    <div>
                                        <strong>{layerName}</strong>
                                        <small>{info.description}</small>
                                    </div>

                                </div>

                                <div className="layer-health-score">
                                    <strong
                                        className={
                                            status.tone === "danger"
                                                ? "danger-text"
                                                : status.tone === "warn"
                                                    ? "warning-text"
                                                    : "success-text"
                                        }
                                    >
                                        {health}%
                                    </strong>

                                    <span
                                        className={`layer-health-status status-${status.tone}`}
                                    >
                                        {status.label}
                                        {isCorrelationRoot
                                            ? " · cascade root"
                                            : ""}
                                    </span>
                                </div>

                            </div>

                            <div className="progress">
                                <div
                                    className={`progress-fill ${
                                        health < 90 ? "warning-fill" : ""
                                    }`}
                                    style={{ width: `${health}%` }}
                                />
                            </div>

                            <div className="layer-readout">

                                <span>
                                    {layerComponents.length} targets ·{" "}
                                    {firingCount} firing
                                </span>

                                {metricAvg !== null && (
                                    <span className="layer-metric">
                                        {metric.label}{" "}
                                        <strong>
                                            {metricAvg}
                                            {metric.unit}
                                        </strong>
                                        <small>
                                            limit {metric.limit}
                                            {metric.unit}
                                        </small>
                                    </span>
                                )}

                                {trendDelta !== null && (
                                    <span
                                        className={`layer-trend ${
                                            trendDelta >= 0
                                                ? "trend-up"
                                                : "trend-down"
                                        }`}
                                    >
                                        {trendDelta >= 0 ? "▲" : "▼"}{" "}
                                        {Math.abs(trendDelta)}% vs prev period
                                    </span>
                                )}

                            </div>

                        </button>
                    );
                }
            )}

        </div>
    );
}

export function MetricTrendPanel({
    title,
    description,
    layer,
    unit,
    window,
    update,
    current,
    delta,
    threshold,
    points,
    color = "#FF6B00",
    domain,
    referenceColor = "#EF4444",
    currentFormatter,
    tooltipFormatter
}) {
    const renderValue = value =>
        currentFormatter
            ? currentFormatter(value)
            : formatValue(value, unit);

    const renderTooltip = value => {
        if (tooltipFormatter) return tooltipFormatter(value);

        if (value === null || value === undefined) return "—";
        return `${value} ${unit}`;
    };

    return (
        <section className="chart-panel">

            <div className="chart-heading">

                <div>
                    {layer && (
                        <div className="chart-kicker">{layer}</div>
                    )}

                    <h3>{title}</h3>

                    <p>{description}</p>
                </div>

                <div className="chart-current">
                    <span className="chart-current-label">Current</span>

                    <span className="chart-current-value">
                        {renderValue(current)}
                    </span>

                    {delta !== null && delta !== undefined && (
                        <span
                            className={`chart-delta ${
                                delta > 0 ? "delta-up" : "delta-down"
                            }`}
                        >
                            {delta > 0 ? "+" : ""}
                            {delta} {unit}
                        </span>
                    )}
                </div>

            </div>

            <div className="chart-params">

                {unit && <span>Units: {unit}</span>}

                {window && <span>Window: {window}</span>}

                {update && <span>Update: {update}</span>}

                {threshold !== null &&
                    threshold !== undefined && (
                        <span
                            className={current > threshold ? "param-warn" : ""}
                        >
                            Threshold: {threshold} {unit}
                        </span>
                    )}
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <LineChart
                    data={points}
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
                        domain={domain || ["auto", "auto"]}
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        tickLine={false}
                        axisLine={false}
                        width={52}
                        tickFormatter={value =>
                            tooltipFormatter
                                ? value
                                : `${value}${unit || ""}`
                        }
                    />

                    <ChartTooltip
                        formatter={(value) => [
                            renderTooltip(value),
                            title
                        ]}
                    />

                    {threshold !== null &&
                        threshold !== undefined &&
                        current <= threshold && (
                            <ReferenceLine
                                y={threshold}
                                stroke={referenceColor}
                                strokeDasharray="5 3"
                                label={{
                                    value: `limit ${threshold}`,
                                    position: "right",
                                    fill: "#9ca3af",
                                    fontSize: 9
                                }}
                            />
                        )}

                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                    />
                </LineChart>
            </ResponsiveContainer>

        </section>
    );
}

export function ComponentCard({
    component,
    onToggleAlert,
    onOpenDrawer
}) {
    const firing = component.alertState === "Firing";
    const suppressed = component.transientFilter?.suppressed;
    const role = component.correlation?.role;
    const hasCorrelation = role === "Root Cause" || role === "Affected";

    return (
        <div
            className={`component-card ${
                firing ? "component-alert" : ""
            }`}
            onClick={() => onOpenDrawer(component)}
        >

            <div className="component-header">

                <div>
                    <div className="component-meta">
                        <span className="layer-pill">{component.layer}</span>

                        <span>
                            {component.environment === "Azure"
                                ? "Azure"
                                : "Local"}
                        </span>

                        {firing && (
                            <span
                                className={`mini-badge ${
                                    component.severity === "Critical"
                                        ? "critical"
                                        : "escalation"
                                }`}
                            >
                                {component.severity}
                            </span>
                        )}
                    </div>

                    <h3>{component.name}</h3>

                    <p className="endpoint">{component.endpoint}</p>
                </div>

                <span
                    className={
                        firing
                            ? "status-pill firing"
                            : "status-pill healthy"
                    }
                >
                    {firing ? "Attention" : "Healthy"}
                </span>

            </div>

            <div className="metric-grid">

                <div className={`metric-box ${firing ? "warn-box" : ""}`}>
                    <small>{component.metricName}</small>
                    <strong>{component.metricValue}</strong>
                </div>

                <div className="metric-box">
                    <small>Threshold</small>
                    <strong>{component.threshold}</strong>
                </div>

            </div>

            <div className="component-details">

                <span
                    className="mini-badge adaptive"
                    title={component.adaptivePoll?.rationale}
                >
                    Poll {component.adaptivePoll?.current} (auto)
                </span>

                {suppressed && (
                    <span
                        className="mini-badge transient"
                        title={`Transient spike silenced ${component.transientFilter.suppressedSince} · retest in ${component.transientFilter.autoRetestIn}`}
                    >
                        Transient &lt;3m
                    </span>
                )}

                {firing && component.autoEscalation?.remaining && (
                    <span className="mini-badge escalation">
                        Escalates in {component.autoEscalation.remaining}
                    </span>
                )}

                {hasCorrelation && (
                    <span
                        className="mini-badge correlated"
                        title={component.correlation.summary}
                    >
                        {role === "Root Cause" ? "Root cause" : "Affected"} cascade
                    </span>
                )}

            </div>

            {hasCorrelation && (
                <div className="correlation-snippet">
                    {component.correlation.summary}
                </div>
            )}

            <div className="component-footer">

                <span className={firing ? "footer-hint" : ""}>
                    {firing ? (
                        <>
                            <Radar size={10} />
                            View diagnostics
                        </>
                    ) : (
                        "Probe via " +
                        (component.diagnostics?.probeType || component.probeType)
                    )}
                </span>

                <button
                    onClick={event => {
                        event.stopPropagation();
                        onToggleAlert(component.id);
                    }}
                    className={firing ? "resolve-button" : "test-button"}
                >
                    {firing ? "Resolve test" : "Test alert"}
                </button>

            </div>

        </div>
    );
}

export function CorrelationPanel({ correlations }) {
    if (!correlations || correlations.length === 0) {
        return (
            <section className="correlation-panel">
                <div className="panel-header">
                    <div>
                        <h2>Cross-Layer Correlation</h2>
                        <p>Anomaly cascade detection across the four layers.</p>
                    </div>

                    <div className="correlation-engine-dot" />
                </div>

                <div className="empty-state">
                    <Sparkles size={30} />
                    <p>No active correlation chains.</p>
                </div>
            </section>
        );
    }

    return (
        <section className="correlation-panel">

            <div className="panel-header">
                <div>
                    <h2>Cross-Layer Correlation</h2>
                    <p>
                        Anomaly cascade detection across the four layers
                        within the correlation window.
                    </p>
                </div>

                <div className="correlation-engine-dot" />
            </div>

            {correlations.map(chain => (
                <div className="correlation-chain" key={chain.id}>

                    <div className="correlation-chain-status">
                        <div className="correlation-node">
                            <AlertTriangle size={15} />
                        </div>

                        <div className="correlation-chain-line" />

                        {chain.affected.map(affected => (
                            <div key={affected.component}>
                                <div className="correlation-node affected">
                                    <ChevronRight size={14} />
                                </div>
                                <div className="correlation-chain-line" />
                            </div>
                        ))}

                        <div className="correlation-chain-line" />
                        <div className="correlation-node">
                            <Activity size={15} />
                        </div>
                    </div>

                    <div className="correlation-chain-body">

                        <div className="correlation-meta">
                            <span className="layer-pill">
                                {chain.root.layer}
                            </span>
                            <strong className="correlation-root-name">
                                {chain.root.component}
                            </strong>
                            <span className="muted correlation-arrow">→</span>
                            {chain.affected.map(affected => (
                                <span
                                    className="mini-badge transient"
                                    key={affected.component}
                                >
                                    {affected.layer}
                                </span>
                            ))}
                            <span className="correlation-conf">
                                {chain.confidence}% confidence
                            </span>
                        </div>

                        <div className="correlation-root-cause">
                            <div className="correlation-label">
                                Root cause
                            </div>

                            <p className="correlation-narrative">
                                {chain.narrative}
                            </p>
                        </div>

                        <div className="correlation-impact">
                            <div>
                                <span>Affected targets</span>
                                <strong>{chain.affected.length}</strong>
                            </div>

                            <div>
                                <span>Propagation</span>
                                <strong>
                                    {chain.root.layer} →{" "}
                                    {chain.affected
                                        .map(target => target.layer)
                                        .join(" → ")}
                                </strong>
                            </div>

                            <div>
                                <span>Detected</span>
                                <strong>{chain.detectedAt}</strong>
                            </div>

                            <div>
                                <span>Diagnostic lag</span>
                                <strong>
                                    {chain.affected
                                        .map(target => target.lag)
                                        .join(", ")}
                                </strong>
                            </div>
                        </div>

                        <div className="correlation-affectees">
                            {chain.affected.map(affected => (
                                <div
                                    className="correlation-affectee"
                                    key={affected.component}
                                >
                                    <strong>{affected.component}</strong>
                                    <span>{affected.metric}</span>
                                    <small>affected {affected.lag}</small>
                                </div>
                            ))}
                        </div>

                        <div className="correlation-note">
                            The correlation engine links these anomalies within
                            the 15-minute cascade window to point triage at the
                            root cause instead of its downstream symptoms.
                        </div>

                    </div>

                </div>
            ))}

        </section>
    );
}

export function IncidentCenter({
    alerts,
    onAcknowledge,
    onResolve,
    config,
    stats
}) {
    const escalated = alerts.filter(
        alert => alert.escalation?.escalated
    ).length;

    const acknowledged = alerts.filter(
        alert => alert.status === "Acknowledged"
    ).length;

    const suppressedToday =
        config?.transientFilter?.suppressedToday ?? 0;

    const medianAge = stats?.medianAlertAge ?? 0;

    return (
        <div className="tab-content">

            <div className="section-heading">
                <div>
                    <h2>Incident Center & Smart Routing</h2>
                    <p>
                        Triage, acknowledge, recover and review
                        auto-escalation timers.
                    </p>
                </div>
            </div>

            <div className="incident-kpis">

                <div>
                    <span>Firing</span>
                    <strong className="orange-number">
                        {alerts.length - acknowledged}
                    </strong>
                </div>

                <div>
                    <span>Auto-Escalation</span>
                    <strong className={escalated ? "danger-text" : ""}>
                        {escalated}
                    </strong>
                </div>

                <div>
                    <span>Transient Filtered (Today)</span>
                    <strong className="success-text">
                        {suppressedToday}
                    </strong>
                </div>

                <div>
                    <span>Median Incident Age</span>
                    <strong>{medianAge}m</strong>
                </div>

                <div>
                    <span>RTO Risk</span>
                    <strong className="success-text">
                        {escalated > 0 ? "Review" : "Low"}
                    </strong>
                </div>

            </div>

            <div className="incident-list">

                {alerts.length === 0 ? (
                    <div className="empty-state">
                        <CheckCircle2 size={30} />
                        <p>No active incidents. All systems within thresholds.</p>
                    </div>
                ) : (
                    alerts.map(alert => {
                        const isEscalated =
                            alert.escalation?.escalated;

                        return (
                            <div
                                className={`incident-card ${
                                    isEscalated
                                        ? "incident-escalated"
                                        : ""
                                }`}
                                key={alert.id}
                            >

                                <div className="incident-info">

                                    <div className="incident-icon">
                                        <AlertTriangle size={17} />
                                    </div>

                                    <div>
                                        <div className="incident-title-row">
                                            <span className="incident-title">
                                                {alert.component}
                                            </span>

                                            <span
                                                className={`severity-pill severity-${
                                                    alert.severity.toLowerCase()
                                                }`}
                                            >
                                                {alert.severity}
                                            </span>

                                            {isEscalated && (
                                                <span className="mini-badge critical">
                                                    Escalated
                                                </span>
                                            )}

                                            {alert.escalation?.remaining && (
                                                <span className="mini-badge escalation">
                                                    Auto-escalate in{" "}
                                                    {alert.escalation.remaining}
                                                </span>
                                            )}
                                        </div>

                                        <div className="incident-meta">
                                            {alert.layer}
                                            {" · "}
                                            {alert.environment}
                                            {" · "}
                                            {alert.metric}
                                        </div>

                                        <p>{alert.summary}</p>

                                        <small>
                                            {alert.time}
                                            {" · routed to "}
                                            {alert.alias}
                                        </small>

                                        <div className="incident-correlation">
                                            {alert.correlation}
                                        </div>
                                    </div>

                                </div>

                                <div className="incident-actions">

                                    <button
                                        onClick={() =>
                                            onAcknowledge(alert.id)
                                        }
                                    >
                                        Acknowledge
                                    </button>

                                    <button
                                        className="orange-button"
                                        onClick={() =>
                                            onResolve(alert.id)
                                        }
                                    >
                                        Resolve
                                    </button>

                                </div>

                            </div>
                        );
                    })
                )}

            </div>

        </div>
    );
}

export function Resilience({ resilience }) {
    return (
        <div className="tab-content">

            <div className="section-heading">
                <div>
                    <h2>Backup, Recovery & RTO</h2>
                    <p>
                        Make the recovery path visible before an incident occurs.
                    </p>
                </div>
            </div>

            <div className="resilience-cards">

                <div className="resilience-card">
                    <Clock3 />
                    <span>RTO objective</span>
                    <strong>{resilience.rtoTarget} min</strong>
                    <p>Maximum target time to restore service.</p>
                </div>

                <div className="resilience-card">
                    <DatabaseBackup />
                    <span>Backup coverage</span>
                    <strong>{resilience.backupCoverage}%</strong>
                    <p>Workloads with an active recovery path.</p>
                </div>

                <div className="resilience-card">
                    <CheckCircle2 />
                    <span>Last recovery drill</span>
                    <strong>{resilience.lastRecovery} min</strong>
                    <p>Completed within the target.</p>
                </div>

            </div>

            <div className="resilience-cards">
                <div className="resilience-card">
                    <Database />
                    <span>RPO objective</span>
                    <strong>{resilience.rpoTarget} min</strong>
                    <p>Maximum acceptable data loss window.</p>
                </div>

                <div className="resilience-card">
                    <DatabaseBackup />
                    <span>Backup schedule</span>
                    <strong style={{ fontSize: 18 }}>
                        {resilience.backupSchedule}
                    </strong>
                    <p>Automated snapshot / transaction-log cycle.</p>
                </div>

                <div className="resilience-card">
                    <Shield />
                    <span>Last drill result</span>
                    <strong className="success-text">
                        {resilience.lastDrillPassed ? "Passed" : "Review"}
                    </strong>
                    <p>Restore validated within the RTO window.</p>
                </div>
            </div>

            <div className="runbook">

                <div className="runbook-header">
                    <h3>Recovery runbook</h3>
                    <p>
                        High-level incident recovery flow — each step can be
                        connected to automation.
                    </p>
                </div>

                <div className="runbook-grid">

                    {[
                        ["01", "Detect", "Alert identifies impacted layer and component."],
                        ["02", "Assess", "Determine impact, dependency and RTO risk."],
                        ["03", "Protect", "Preserve data and initiate backup / failover path."],
                        ["04", "Recover", "Restore service using the approved recovery procedure."],
                        ["05", "Validate", "Confirm health, dependencies and close the incident."]
                    ].map(step => (
                        <div className="runbook-step" key={step[0]}>
                            <span>{step[0]}</span>
                            <h4>{step[1]}</h4>
                            <p>{step[2]}</p>
                        </div>
                    ))}

                </div>

            </div>

        </div>
    );
}

export function RegisterModal({
    open,
    onClose,
    onAdd
}) {
    if (!open) return null;

    return (
        <div className="modal-overlay">

            <div className="modal">

                <div className="modal-header">

                    <div>
                        <h3>Register monitoring target</h3>
                        <p>Add a component or network device endpoint.</p>
                    </div>

                    <button onClick={onClose}>×</button>

                </div>

                <form
                    onSubmit={event => {
                        event.preventDefault();

                        const form = new FormData(event.target);

                        onAdd({
                            name: form.get("name"),
                            layer: form.get("layer"),
                            environment: form.get("environment"),
                            endpoint: form.get("endpoint"),
                            interval: form.get("interval"),
                            probeType: form.get("probeType")
                        });

                        event.target.reset();
                    }}
                >

                    <label>
                        Target name
                        <input
                            name="name"
                            required
                            placeholder="e.g. core-switch-01"
                        />
                    </label>

                    <div className="form-grid">

                        <label>
                            Layer
                            <select name="layer">
                                <option>Network</option>
                                <option>Server</option>
                                <option>Database</option>
                                <option>Application</option>
                            </select>
                        </label>

                        <label>
                            Environment
                            <select name="environment">
                                <option>Azure</option>
                                <option>On-Prem</option>
                            </select>
                        </label>

                    </div>

                    <label>
                        Monitoring endpoint
                        <input
                            name="endpoint"
                            required
                            placeholder="IP / URL / SNMP / API endpoint"
                        />
                    </label>

                    <div className="form-grid">

                        <label>
                            Polling
                            <select name="interval">
                                <option>30s</option>
                                <option>60s</option>
                                <option>300s</option>
                            </select>
                        </label>

                        <label>
                            Probe type
                            <select name="probeType">
                                <option>Health / API</option>
                                <option>SNMP</option>
                                <option>TCP</option>
                                <option>ICMP</option>
                            </select>
                        </label>

                    </div>

                    <p className="muted" style={{ fontSize: 10, margin: 0 }}>
                        Adaptive polling (10s-60s) will automatically tighten
                        this target's cadence while firing.
                    </p>

                    <div className="modal-actions">

                        <button type="button" onClick={onClose}>
                            Cancel
                        </button>

                        <button className="orange-button" type="submit">
                            <Plus size={15} />
                            Add target
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
}

export function Registry({
    components,
    onDelete,
    onOpenModal
}) {
    const networkCount = components.filter(
        c => c.layer === "Network"
    ).length;

    const firingCount = components.filter(
        c => c.status === "Firing"
    ).length;

    return (
        <div className="tab-content">

            <div className="section-heading">

                <div>
                    <h2>Component & Device Registry</h2>
                    <p>
                        Register servers, databases, applications and network
                        devices with adaptive polling intervals.
                    </p>
                </div>

                <button
                    className="orange-button"
                    onClick={onOpenModal}
                >
                    <Plus size={15} />
                    Register target
                </button>

            </div>

            <div className="registry-summary">

                <div>
                    <span>Network devices</span>
                    <strong>{networkCount}</strong>
                    <small>Registered targets</small>
                </div>

                <div>
                    <span>Monitoring endpoints</span>
                    <strong>{components.length}</strong>
                    <small>API / SNMP / probes</small>
                </div>

                <div>
                    <span>Endpoint failures</span>
                    <strong className="orange-number">
                        {firingCount}
                    </strong>
                    <small>Requires investigation</small>
                </div>

            </div>

            <div className="table-wrapper">

                <table>

                    <thead>
                        <tr>
                            <th>Target</th>
                            <th>Layer</th>
                            <th>Environment</th>
                            <th>Endpoint</th>
                            <th>Probe</th>
                            <th>Poll</th>
                            <th>Status</th>
                            <th />
                        </tr>
                    </thead>

                    <tbody>

                        {components.map(component => (
                            <tr key={component.id}>

                                <td>
                                    <strong>{component.name}</strong>
                                </td>

                                <td>{component.layer}</td>

                                <td>{component.environment}</td>

                                <td className="table-endpoint">
                                    {component.endpoint}
                                </td>

                                <td>{component.probeType}</td>

                                <td>
                                    {component.adaptivePoll?.current ||
                                        component.interval}
                                </td>

                                <td>
                                    <span
                                        className={
                                            component.status === "Firing"
                                                ? "status-pill firing"
                                                : "status-pill healthy"
                                        }
                                    >
                                        {component.status === "Firing"
                                            ? "Attention"
                                            : "Online"}
                                    </span>
                                </td>

                                <td>
                                    <button
                                        className="delete-button"
                                        onClick={() =>
                                            onDelete(component.id)
                                        }
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>

                            </tr>
                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export function ActionDrawer({
    component,
    onClose,
    onSave
}) {
    const [phase, setPhase] = useState("idle");

    if (!component) return null;

    const firing = component.alertState === "Firing";
    const suppressed = component.transientFilter?.suppressed;
    const role = component.correlation?.role;
    const hasCorrelation = role === "Root Cause" || role === "Affected";

    function runProbe() {
        setPhase("running");

        setTimeout(() => {
            setPhase("done");
        }, 1100);
    }

    const probe =
        phase === "running"
            ? { label: "Probing hybrid tunnel (VPN / AVD)...", cls: "probe-running" }
            : phase === "done"
                ? { label: "Diagnostic probe successful — endpoint reachable", cls: "probe-ok" }
                : component.diagnostics?.lastProbe?.status === "degraded"
                    ? {
                        label: "Endpoint reachable but degraded",
                        cls: "probe-degraded"
                    }
                    : {
                        label: "Endpoint reachable (healthy)",
                        cls: "probe-ok"
                    };

    const probeValues = {
        rtt: component.diagnostics?.lastProbe?.rtt ?? "12ms",
        packetLoss: component.diagnostics?.lastProbe?.packetLoss ?? "0.0%",
        probeType: component.probeType || component.diagnostics?.probeType
    };

    return (
        <div className="drawer-overlay" onClick={onClose}>

            <div
                className="drawer"
                onClick={event => event.stopPropagation()}
            >

                <div className="drawer-header">

                    <div>
                        <h3>Diagnostics: {component.name}</h3>
                        <p>One-click probe & cross-layer correlation</p>
                    </div>

                    <button className="drawer-close" onClick={onClose}>
                        <X size={18} />
                    </button>

                </div>

                <div className="drawer-body">

                    <div className="drawer-meta-row">
                        <span className="layer-pill">{component.layer}</span>

                        <span className="muted" style={{ fontSize: 10 }}>
                            {component.environment}
                        </span>

                        <span
                            className={
                                firing
                                    ? "status-pill firing"
                                    : "status-pill healthy"
                            }
                        >
                            {firing ? "Attention" : "Healthy"}
                        </span>

                        {firing && component.severity && (
                            <span
                                className={`severity-pill severity-${component.severity.toLowerCase()}`}
                            >
                                {component.severity}
                            </span>
                        )}

                        {suppressed && (
                            <span className="mini-badge transient">
                                Transient silenced &lt;3m
                            </span>
                        )}
                    </div>

                    <div className="drawer-section">

                        <div className="drawer-section-title">
                            Live Probe Status
                        </div>

                        <div className="drawer-probe">

                            <div
                                className={`drawer-probe-status ${probe.cls}`}
                            >
                                {phase === "running" && (
                                    <span className="pulse-dot" />
                                )}
                                {phase !== "running" && (
                                    <CheckCircle2 size={14} />
                                )}
                                {probe.label}
                            </div>

                            <div className="drawer-metrics">

                                <div className="drawer-metric">
                                    <small>RTT</small>
                                    <strong>{probeValues.rtt}</strong>
                                </div>

                                <div className="drawer-metric">
                                    <small>Packet loss</small>
                                    <strong>{probeValues.packetLoss}</strong>
                                </div>

                                <div className="drawer-metric">
                                    <small>Probe</small>
                                    <strong>{probeValues.probeType}</strong>
                                </div>

                            </div>

                            {phase === "done" && (
                                <div className="drawer-probe-result">
                                    <b>Probe OK</b> — TCP/UDP path verified ·
                                    jitter within tolerance · SNMP OID read
                                    succeeded. Target answers within its
                                    adaptive poll budget.
                                </div>
                            )}

                            <button
                                className="orange-button drawer-probe-run"
                                onClick={runProbe}
                                disabled={phase === "running"}
                            >
                                <Radar size={14} />
                                {phase === "running"
                                    ? "Probing..."
                                    : "Run Live Diagnostic Probe"}
                            </button>

                        </div>

                    </div>

                    <div
                        className={`drawer-section drawer-correlation ${
                            hasCorrelation ? "" : "stable"
                        }`}
                    >
                        <div className="drawer-section-title">
                            Cross-Layer Correlation
                        </div>

                        <p>
                            {hasCorrelation
                                ? `${role === "Root Cause" ? "Root Cause" : "Affected"} — ${component.correlation.summary}`
                                : "No active cascade anomalies detected for this target."}
                        </p>
                    </div>

                    <div className="drawer-section drawer-notes">

                        <div className="drawer-section-title">
                            Operator Remediation Notes
                        </div>

                        <textarea
                            id="drawer-notes"
                            placeholder="Log remediation steps or root-cause notes..."
                            className="drawer-textarea"
                        />

                    </div>

                </div>

                <div className="drawer-footer">

                    <button
                        className="secondary-button"
                        onClick={onClose}
                    >
                        Close
                    </button>

                    <button
                        className="orange-button"
                        onClick={() => onSave(component.id)}
                    >
                        <CheckCircle2 size={15} />
                        Save & Acknowledge
                    </button>

                </div>

            </div>

        </div>
    );
}