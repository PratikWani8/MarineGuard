import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import api from "../services/api";


const ENDPOINT = "/dashboard/analytics";

const EMPTY_ANALYTICS = {
  summary: {
    totalRecords: 0,
    totalDetections: 0,
    totalAnomalies: 0,
    verifiedDetections: 0,
    pendingDetections: 0,
    surveys: 0,
    missions: 0,
  },
  byClass: [],
  byStatus: [],
  byMonth: [],
  bySurvey: [],
  confidence: [],
  depth: [],
  coordinates: [],
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function firstDefined(obj, keys, fallback = null) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return fallback;
}

function normalizeAnalytics(payload) {
  const root =
    payload?.analytics ||
    payload?.data ||
    payload?.result ||
    payload ||
    {};

  const summarySource = root.summary || payload?.summary || {};
  const charts = root.charts || payload?.charts || {};

  const detections =
    asArray(root.detections).length
      ? root.detections
      : asArray(payload?.detections);

  const byClassRaw =
    charts.byClass ||
    charts.by_class ||
    charts.detectionsByClass ||
    charts.detectionByClass ||
    root.byClass ||
    root.by_class ||
    [];

  const byStatusRaw =
    charts.byStatus ||
    charts.by_status ||
    charts.detectionsByStatus ||
    root.byStatus ||
    root.by_status ||
    [];

  const byMonthRaw =
    charts.byMonth ||
    charts.by_month ||
    charts.monthly ||
    charts.monthlyDetections ||
    root.byMonth ||
    root.by_month ||
    [];

  const bySurveyRaw =
    charts.bySurvey ||
    charts.by_survey ||
    charts.surveyStats ||
    root.bySurvey ||
    root.by_survey ||
    [];

  const confidenceRaw =
    charts.confidence ||
    charts.confidenceDistribution ||
    charts.confidence_distribution ||
    root.confidence ||
    root.confidenceDistribution ||
    [];

  const depthRaw =
    charts.depth ||
    charts.depthDistribution ||
    charts.depth_distribution ||
    root.depth ||
    root.depthDistribution ||
    [];

  const coordinatesRaw =
    charts.coordinates ||
    charts.heatmapPoints ||
    charts.heatmap_points ||
    root.coordinates ||
    root.heatmapPoints ||
    [];

  const normalizedDetections = detections.map((item) => ({
    ...item,

    className: firstDefined(
      item,
      ["className", "class_name", "class", "label", "category", "classification"],
      "Unknown"
    ),

    status: firstDefined(
      item,
      ["status", "verificationStatus", "verification_status"],
      "Unknown"
    ),

    confidence: number(
      firstDefined(
        item,
        ["confidence", "confidencePercent", "confidence_percent"],
        0
      )
    ),

    depth: number(
      firstDefined(
        item,
        ["depth", "depth_m", "depthM", "waterDepth"],
        0
      )
    ),

    createdAt: firstDefined(
      item,
      ["createdAt", "created_at", "date", "timestamp"],
      null
    ),

    surveyId: firstDefined(
      item,
      ["surveyId", "survey_id", "survey"],
      "Unknown"
    ),
  }));

  let byClass = asArray(byClassRaw).map((item) => ({
    name: String(
      firstDefined(
        item,
        ["name", "className", "class_name", "class", "label", "_id"],
        "Unknown"
      )
    ),
    value: number(
      firstDefined(item, ["value", "count", "total", "detections"], 0)
    ),
  }));

  if (!byClass.length && normalizedDetections.length) {
    const counts = {};

    normalizedDetections.forEach((item) => {
      const name = String(item.className || "Unknown");
      counts[name] = (counts[name] || 0) + 1;
    });

    byClass = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }

  let byStatus = asArray(byStatusRaw).map((item) => ({
    name: String(
      firstDefined(item, ["name", "status", "label", "_id"], "Unknown")
    ),
    value: number(
      firstDefined(item, ["value", "count", "total", "detections"], 0)
    ),
  }));

  if (!byStatus.length && normalizedDetections.length) {
    const counts = {};

    normalizedDetections.forEach((item) => {
      const status = String(item.status || "Unknown");
      counts[status] = (counts[status] || 0) + 1;
    });

    byStatus = Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }

  const byMonth = asArray(byMonthRaw).map((item) => ({
    month: String(
      firstDefined(item, ["month", "label", "date", "period", "_id"], "Unknown")
    ),
    detections: number(
      firstDefined(item, ["detections", "count", "value", "total"], 0)
    ),
    anomalies: number(
      firstDefined(item, ["anomalies", "anomalyCount", "anomaly_count"], 0)
    ),
  }));

  const bySurvey = asArray(bySurveyRaw).map((item) => ({
    survey: String(
      firstDefined(
        item,
        ["survey", "surveyName", "survey_name", "surveyId", "survey_id", "_id"],
        "Unknown"
      )
    ),
    detections: number(
      firstDefined(item, ["detections", "count", "total", "value"], 0)
    ),
  }));

  const confidence = asArray(confidenceRaw).map((item) => ({
    confidence: String(
      firstDefined(item, ["confidence", "range", "bucket", "label", "_id"], "0")
    ),
    count: number(
      firstDefined(item, ["count", "value", "total", "detections"], 0)
    ),
  }));

  const depth = asArray(depthRaw).map((item) => ({
    depth: String(
      firstDefined(item, ["depth", "depth_m", "depthM", "range", "bucket", "_id"], "0")
    ),
    detections: number(
      firstDefined(item, ["detections", "count", "value", "total"], 0)
    ),
  }));

  const coordinates = asArray(coordinatesRaw)
    .map((item) => ({
      latitude: number(firstDefined(item, ["latitude", "lat"], NaN), NaN),
      longitude: number(
        firstDefined(item, ["longitude", "lng", "lon"], NaN),
        NaN
      ),
      confidence: number(
        firstDefined(item, ["confidence", "confidencePercent"], 0)
      ),
      className: firstDefined(
        item,
        ["className", "class_name", "class", "label", "classification"],
        "Unknown"
      ),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.latitude) &&
        Number.isFinite(item.longitude)
    );

  const calculatedTotal =
    normalizedDetections.length ||
    byClass.reduce((sum, item) => sum + number(item.value), 0);

  const summary = {
    totalRecords: number(
      firstDefined(
        summarySource,
        ["totalRecords", "total_records", "records"],
        calculatedTotal
      )
    ),
    totalDetections: number(
      firstDefined(
        summarySource,
        ["totalDetections", "total_detections", "detections"],
        calculatedTotal
      )
    ),
    totalAnomalies: number(
      firstDefined(
        summarySource,
        ["totalAnomalies", "total_anomalies", "anomalies"],
        0
      )
    ),
    verifiedDetections: number(
      firstDefined(
        summarySource,
        ["verifiedDetections", "verified_detections", "verified"],
        0
      )
    ),
    pendingDetections: number(
      firstDefined(
        summarySource,
        ["pendingDetections", "pending_detections", "pending"],
        0
      )
    ),
    surveys: number(
      firstDefined(
        summarySource,
        ["surveys", "totalSurveys", "total_surveys"],
        root.totalSurveys || 0
      )
    ),
    missions: number(
      firstDefined(
        summarySource,
        ["missions", "totalMissions", "total_missions"],
        root.totalMissions || 0
      )
    ),
  };

  return {
    summary,
    byClass,
    byStatus,
    byMonth,
    bySurvey,
    confidence,
    depth,
    coordinates,
  };
}

function StatCard({ title, value, subtitle }) {
  return (
    <div className="analytics-stat-card">
      <div className="analytics-stat-title">{title}</div>
      <div className="analytics-stat-value">
        {Number(value || 0).toLocaleString()}
      </div>
      {subtitle && (
        <div className="analytics-stat-subtitle">{subtitle}</div>
      )}
    </div>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <section className={`analytics-chart-card ${className}`}>
      <div className="analytics-chart-title">{title}</div>
      <div className="analytics-chart-body">{children}</div>
    </section>
  );
}

export default function Analytics() {
  const [analytics, setAnalytics] =
    useState(EMPTY_ANALYTICS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAnalytics = async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await api.get(ENDPOINT);
      const normalized = normalizeAnalytics(response?.data);

      setAnalytics(normalized);
      setLastUpdated(new Date());
    } catch (err) {
  console.error("Failed to fetch analytics:", err);

  const data = err?.response?.data;

  let message = "Unable to load analytics data.";

  if (typeof data === "string") {
    message = data;
  } else if (
    typeof data?.message === "string"
  ) {
    message = data.message;
  } else if (
    typeof data?.error === "string"
  ) {
    message = data.error;
  } else if (
    typeof data?.detail === "string"
  ) {
    message = data.detail;
  } else if (
    typeof err?.message === "string"
  ) {
    message = err.message;
  }

  setError(message);
} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    // Refresh analytics every 60 seconds.
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const totalClassDetections = useMemo(
    () =>
      analytics.byClass.reduce(
        (sum, item) => sum + number(item.value),
        0
      ),
    [analytics.byClass]
  );

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-loading">
          Loading MarineGuard analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>MarineGuard Analytics</h1>
          <p>
            Detection, anomaly, survey and sonar-data insights
            fetched from the backend database.
          </p>
        </div>

        <button
          type="button"
          className="analytics-refresh-btn"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="analytics-error">
          <strong>Analytics error:</strong> {error}
          <button
            type="button"
            onClick={() => fetchAnalytics()}
          >
            Retry
          </button>
        </div>
      )}

      <div className="analytics-stats-grid">
        <StatCard
          title="Total Detections"
          value={analytics.summary.totalDetections}
          subtitle="All detected objects"
        />
        <StatCard
          title="Anomalies"
          value={analytics.summary.totalAnomalies}
          subtitle="Potential marine anomalies"
        />
        <StatCard
          title="Verified"
          value={analytics.summary.verifiedDetections}
          subtitle="Verified detections"
        />
        <StatCard
          title="Pending"
          value={analytics.summary.pendingDetections}
          subtitle="Awaiting verification"
        />
        <StatCard
          title="Surveys"
          value={analytics.summary.surveys}
          subtitle="Survey records"
        />
        <StatCard
          title="Missions"
          value={analytics.summary.missions}
          subtitle="Mission records"
        />
      </div>

      <div className="analytics-grid">
        {/* 1. Detection trend */}
        <ChartCard title="Detection Trend">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={analytics.byMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="detections"
                name="Detections"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="anomalies"
                name="Anomalies"
                strokeWidth={2}
                dot={false}
                isAnimationActive={true}
                animationBegin={200}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 2. Detection classes */}
        <ChartCard title="Detections by Class">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={analytics.byClass}
              layout={
                analytics.byClass.length >= 6
                  ? "vertical"
                  : "horizontal"
              }
              margin={
                analytics.byClass.length >= 6
                  ? { left: 30, right: 20 }
                  : { left: 10, right: 20 }
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type={
                  analytics.byClass.length >= 6
                    ? "number"
                    : "category"
                }
                dataKey={
                  analytics.byClass.length >= 6
                    ? undefined
                    : "name"
                }
              />
              <YAxis
                type={
                  analytics.byClass.length >= 6
                    ? "category"
                    : "number"
                }
                dataKey={
                  analytics.byClass.length >= 6
                    ? "name"
                    : undefined
                }
                allowDecimals={false}
                width={
                  analytics.byClass.length >= 6 ? 120 : 50
                }
              />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Detections"
                fill="#f97316"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 3. Status pie */}
        <ChartCard title="Detection Verification Status">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={analytics.byStatus}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={105}
                label
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {analytics.byStatus.map((entry, index) => (
                  <Cell
                    key={`${entry.name}-${index}`}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 4. Survey comparison */}
        <ChartCard title="Detections by Survey">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={analytics.bySurvey}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="survey" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar
                dataKey="detections"
                name="Detections"
                fill="#f97316"
                radius={[6, 6, 0, 0]}
                isAnimationActive={true}
                animationBegin={100}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 5. Confidence distribution */}
        <ChartCard title="Confidence Distribution">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={analytics.confidence}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="confidence" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="count"
                name="Detections"
                fillOpacity={0.25}
                strokeWidth={2}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 6. Depth analysis */}
        <ChartCard title="Detections by Water Depth">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={analytics.depth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="depth"
                label={{
                  value: "Depth (m)",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="detections"
                name="Detections"
                strokeWidth={2}
                isAnimationActive={true}
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* 7. Geographic relationship */}
        <ChartCard
          title="Geographic Detection Distribution"
          className="analytics-wide-card"
        >
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart
              margin={{
                top: 20,
                right: 30,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid />
              <XAxis
                type="number"
                dataKey="longitude"
                name="Longitude"
              />
              <YAxis
                type="number"
                dataKey="latitude"
                name="Latitude"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Legend />
              <Scatter
        name="Detections"
        data={analytics.coordinates}
        fill="#86efac"
        isAnimationActive={true}
        animationBegin={0}
        animationDuration={1200}
        animationEasing="ease-out"
      />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="analytics-footer">
        <span>
          {totalClassDetections.toLocaleString()} detections
          represented in class analytics.
        </span>

        {lastUpdated && (
          <span>
            Last updated{" "}
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <style>{`
        .analytics-page {
          width: 100%;
          min-height: 100%;
          padding: 24px;
          box-sizing: border-box;
        }

        .analytics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .analytics-header h1 {
          margin: 0 0 6px;
          font-size: 28px;
          font-weight: 700;
        }

        .analytics-header p {
          margin: 0;
          opacity: 0.7;
        }

        .analytics-refresh-btn {
          border: 0;
          border-radius: 8px;
          padding: 10px 18px;
          cursor: pointer;
          font-weight: 600;
        }

        .analytics-refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .analytics-stats-grid {
          display: grid;
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .analytics-stat-card {
          padding: 18px;
          border: 1px solid rgba(127, 127, 127, 0.22);
          border-radius: 12px;
          background: rgba(127, 127, 127, 0.06);
          animation: analyticsStatIn 0.5s ease-out both;
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .analytics-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(249, 115, 22, 0.3);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.14);
        }

        .analytics-stat-card:nth-child(1) { animation-delay: 0.05s; }
        .analytics-stat-card:nth-child(2) { animation-delay: 0.1s; }
        .analytics-stat-card:nth-child(3) { animation-delay: 0.15s; }
        .analytics-stat-card:nth-child(4) { animation-delay: 0.2s; }
        .analytics-stat-card:nth-child(5) { animation-delay: 0.25s; }
        .analytics-stat-card:nth-child(6) { animation-delay: 0.3s; }

        @keyframes analyticsStatIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .analytics-stat-title {
          font-size: 13px;
          opacity: 0.7;
          margin-bottom: 8px;
        }

        .analytics-stat-value {
          font-size: 27px;
          font-weight: 700;
        }

        .analytics-stat-subtitle {
          margin-top: 5px;
          font-size: 12px;
          opacity: 0.6;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns:
            repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .analytics-chart-card {
          min-width: 0;
          border: 1px solid rgba(127, 127, 127, 0.22);
          border-radius: 12px;
          padding: 18px;
          background: rgba(127, 127, 127, 0.04);

          animation: analyticsCardIn 0.6s ease-out both;
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            box-shadow 0.25s ease;
        }

        .analytics-chart-card:hover {
          transform: translateY(-3px);
          border-color: rgba(249, 115, 22, 0.4);
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.18);
        }

        .analytics-chart-card:nth-child(1) {
          animation-delay: 0.05s;
        }

        .analytics-chart-card:nth-child(2) {
          animation-delay: 0.1s;
        }

        .analytics-chart-card:nth-child(3) {
          animation-delay: 0.15s;
        }

        .analytics-chart-card:nth-child(4) {
          animation-delay: 0.2s;
        }

        .analytics-chart-card:nth-child(5) {
          animation-delay: 0.25s;
        }

        .analytics-chart-card:nth-child(6) {
          animation-delay: 0.3s;
        }

        .analytics-chart-card:nth-child(7) {
          animation-delay: 0.35s;
        }

        @keyframes analyticsCardIn {
          from {
            opacity: 0;
            transform: translateY(18px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .analytics-wide-card {
          grid-column: 1 / -1;
        }

        .analytics-chart-title {
          font-size: 16px;
          font-weight: 650;
          margin-bottom: 12px;
        }

        .analytics-chart-body {
          width: 100%;
          min-height: 320px;
        }

        .analytics-error {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding: 14px;
          border-radius: 8px;
          border: 1px solid rgba(220, 80, 80, 0.35);
        }

        .analytics-error button {
          margin-left: auto;
          cursor: pointer;
        }

        .analytics-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          opacity: 0.7;
        }

        .analytics-footer {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 18px;
          font-size: 12px;
          opacity: 0.6;
        }

        @media (prefers-reduced-motion: reduce) {
          .analytics-chart-card,
          .analytics-stat-card {
            animation: none;
            transition: none;
          }

          .analytics-chart-card:hover,
          .analytics-stat-card:hover {
            transform: none;
          }
        }

        @media (max-width: 1200px) {
          .analytics-stats-grid {
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 850px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }

          .analytics-wide-card {
            grid-column: auto;
          }
        }

        @media (max-width: 650px) {
          .analytics-page {
            padding: 14px;
          }

          .analytics-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .analytics-stats-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }

          .analytics-footer {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
