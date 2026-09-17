import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleDollarSign,
  Target,
  Trophy,
  AlertTriangle,
  TrendingUp,
  Layers3,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { opportunityApi } from "../../services/opportunityApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

function formatAxisCurrency(value) {
  const amount = Number(value || 0);

  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }

  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }

  return `₹${Math.round(amount / 1000)}K`;
}

export default function Opportunities() {
  const [summary, setSummary] = useState(null);
  const [funnel, setFunnel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [summaryResult, funnelResult] = await Promise.all([
          opportunityApi.getSummary(),
          opportunityApi.getFunnel(),
        ]);

        setSummary(summaryResult);
        setFunnel(funnelResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const stageOrder = [
    "Prospecting",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
  ];

  const chartData = useMemo(
    () =>
      stageOrder
        .map((stage) => funnel.find((item) => item.stage === stage))
        .filter(Boolean),
    [funnel],
  );

  const maxPipeline = useMemo(
    () =>
      Math.max(
        ...chartData.map((stage) => Number(stage.pipeline_value || 0)),
        1,
      ),
    [chartData],
  );

  const openPipeline = useMemo(
    () =>
      chartData
        .filter(
          (stage) => stage.stage !== "Won" && stage.stage !== "Lost",
        )
        .reduce(
          (total, stage) => total + Number(stage.pipeline_value || 0),
          0,
        ),
    [chartData],
  );

  const wonStage = chartData.find((stage) => stage.stage === "Won");
  const lostStage = chartData.find((stage) => stage.stage === "Lost");

  if (loading) {
    return (
      <section className="opportunities-page">
        <div className="dashboard-loading">
          <div className="loading-orb" />
          <h2>Preparing pipeline analytics</h2>
          <p>Fetching live opportunity data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="opportunities-page">
        <div className="dashboard-error">
          <div className="error-icon">!</div>
          <div>
            <span className="page-eyebrow">PIPELINE DATA</span>
            <h2>Unable to load opportunity analytics</h2>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="opportunities-page">
      <div className="page-header opportunities-header">
        <div>
          <span className="page-eyebrow">OPPORTUNITY ANALYTICS</span>
          <h1>Sales pipeline</h1>
          <p>
            Monitor opportunity volume, commercial value, conversion, and
            stage progression across the CRM.
          </p>
        </div>

        <div className="sales-period-badge">
          <Layers3 size={15} />
          Live pipeline
        </div>
      </div>

      <div className="overview-kpis">
        <article className="metric-card metric-indigo">
          <div className="metric-topline">
            <div className="metric-icon">
              <Layers3 size={17} />
            </div>
            <span className="metric-live">
              <span />
              Live
            </span>
          </div>

          <span className="metric-label">Total opportunities</span>
          <strong>{summary.total_opportunities.toLocaleString("en-IN")}</strong>
          <small>All recorded opportunities</small>
        </article>

        <article className="metric-card metric-green">
          <div className="metric-topline">
            <div className="metric-icon">
              <Trophy size={17} />
            </div>
            <span className="metric-live">
              <span />
              Closed
            </span>
          </div>

          <span className="metric-label">Won opportunities</span>
          <strong>{summary.won_opportunities.toLocaleString("en-IN")}</strong>
          <small>Successfully closed deals</small>
        </article>

        <article className="metric-card metric-blue">
          <div className="metric-topline">
            <div className="metric-icon">
              <Target size={17} />
            </div>
            <span className="metric-live">
              <span />
              Conversion
            </span>
          </div>

          <span className="metric-label">Win rate</span>
          <strong>{summary.win_rate_pct}%</strong>
          <small>Won opportunities / total opportunities</small>
        </article>

        <article className="metric-card metric-amber">
          <div className="metric-topline">
            <div className="metric-icon">
              <CircleDollarSign size={17} />
            </div>
            <span className="metric-live">
              <span />
              Pipeline
            </span>
          </div>

          <span className="metric-label">Total pipeline</span>
          <strong>{formatCompactCurrency(summary.total_pipeline_value)}</strong>
          <small>Value across all opportunities</small>
        </article>
      </div>

      <div className="opportunity-main-grid">
        <article className="analytics-panel opportunity-chart-panel">
          <div className="panel-heading opportunity-panel-heading">
            <div>
              <div className="panel-heading-title">
                <BarChart3 size={16} />
                <h2>Pipeline by stage</h2>
              </div>
              <p>Opportunity value across the sales funnel</p>
            </div>

            <span className="panel-count">
              {chartData.length} stages
            </span>
          </div>

          <div className="opportunity-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 14,
                  right: 20,
                  left: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid
                  stroke="#eef1f5"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="stage"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#667085",
                    fontSize: 10,
                  }}
                  dy={8}
                />

                <YAxis
                  width={72}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#98a2b3",
                    fontSize: 10,
                  }}
                  tickFormatter={formatAxisCurrency}
                />

                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    border: "1px solid #e4e7ec",
                    borderRadius: "10px",
                    boxShadow:
                      "0 12px 28px rgba(16, 24, 40, 0.10)",
                  }}
                  cursor={{
                    fill: "rgba(91, 91, 214, 0.04)",
                  }}
                />

                <Bar
                  dataKey="pipeline_value"
                  fill="#5b5bd6"
                  radius={[7, 7, 0, 0]}
                  maxBarSize={54}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel pipeline-health-panel">
          <div className="panel-heading opportunity-panel-heading">
            <div>
              <div className="panel-heading-title">
                <TrendingUp size={16} />
                <h2>Pipeline intelligence</h2>
              </div>
              <p>Commercial health at a glance</p>
            </div>
          </div>

          <div className="pipeline-primary-metric">
            <span>Open pipeline</span>
            <strong>{formatCompactCurrency(openPipeline)}</strong>
            <small>
              Prospecting through negotiation
            </small>
          </div>

          <div className="pipeline-mini-grid">
            <div className="pipeline-mini-card">
              <div className="pipeline-mini-icon pipeline-mini-green">
                <Trophy size={15} />
              </div>
              <span>Won pipeline</span>
              <strong>
                {formatCompactCurrency(summary.won_pipeline_value)}
              </strong>
            </div>

            <div className="pipeline-mini-card">
              <div className="pipeline-mini-icon pipeline-mini-red">
                <AlertTriangle size={15} />
              </div>
              <span>Lost opportunities</span>
              <strong>{summary.lost_opportunities}</strong>
            </div>

            <div className="pipeline-mini-card">
              <div className="pipeline-mini-icon pipeline-mini-blue">
                <Target size={15} />
              </div>
              <span>Win rate</span>
              <strong>{summary.win_rate_pct}%</strong>
            </div>

            <div className="pipeline-mini-card">
              <div className="pipeline-mini-icon pipeline-mini-indigo">
                <CircleDollarSign size={15} />
              </div>
              <span>Total pipeline</span>
              <strong>
                {formatCompactCurrency(summary.total_pipeline_value)}
              </strong>
            </div>
          </div>

          <div className="pipeline-health-block">
            <div className="pipeline-health-header">
              <span>Stage progression</span>
              <span>{chartData.length} stages</span>
            </div>

            <div className="pipeline-stage-bars">
              {chartData.map((stage, index) => {
                const width =
                  (Number(stage.pipeline_value || 0) / maxPipeline) * 100;

                return (
                  <div className="pipeline-stage-bar" key={stage.stage}>
                    <div className="pipeline-stage-label">
                      <span>{stage.stage}</span>
                      <strong>
                        {formatCompactCurrency(stage.pipeline_value)}
                      </strong>
                    </div>

                    <div className="pipeline-track">
                      <span
                        className={`pipeline-fill pipeline-fill-${index + 1}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </article>
      </div>

      <article className="analytics-panel stage-detail-panel">
        <div className="panel-heading opportunity-panel-heading">
          <div>
            <div className="panel-heading-title">
              <Layers3 size={16} />
              <h2>Stage detail</h2>
            </div>
            <p>Opportunity count and pipeline value by stage</p>
          </div>

          <span className="panel-count">
            {summary.total_opportunities.toLocaleString("en-IN")} opportunities
          </span>
        </div>

        <div className="stage-detail-list">
          {chartData.map((stage, index) => {
            const share =
              (Number(stage.pipeline_value || 0) /
                Math.max(Number(summary.total_pipeline_value || 0), 1)) *
              100;

            return (
              <div className="stage-detail-row" key={stage.stage}>
                <div className={`stage-marker stage-marker-${index + 1}`} />

                <div className="stage-detail-main">
                  <strong>{stage.stage}</strong>

                  <div className="stage-detail-sub">
                    <span>
                      {Number(stage.opportunities).toLocaleString("en-IN")}
                      {" opportunities"}
                    </span>
                    <span>•</span>
                    <span>{share.toFixed(1)}% of pipeline</span>
                  </div>
                </div>

                <div className="stage-detail-value">
                  <strong>{formatCurrency(stage.pipeline_value)}</strong>

                  <div className="stage-detail-progress">
                    <span style={{ width: `${Math.min(share, 100)}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </article>

      <div className="opportunity-bottom-grid">
        <article className="analytics-panel insight-panel">
          <div className="insight-icon">
            <TrendingUp size={19} />
          </div>

          <span className="page-eyebrow">BUSINESS SNAPSHOT</span>

          <h2>
            Current opportunity win rate is {summary.win_rate_pct}%.
          </h2>

          <p>
            Use stage-level pipeline value to identify where commercial
            volume is concentrated and where deals may require attention.
          </p>
        </article>

        <article className="analytics-panel pipeline-closure-panel">
          <div className="panel-heading opportunity-panel-heading">
            <div>
              <div className="panel-heading-title">
                <Target size={16} />
                <h2>Closure view</h2>
              </div>
              <p>Won versus lost opportunity counts</p>
            </div>
          </div>

          <div className="closure-stats">
            <div className="closure-stat closure-stat-won">
              <span>Won</span>
              <strong>
                {summary.won_opportunities.toLocaleString("en-IN")}
              </strong>
              <small>
                {summary.win_rate_pct}% of all opportunities
              </small>
            </div>

            <div className="closure-stat closure-stat-lost">
              <span>Lost</span>
              <strong>
                {summary.lost_opportunities.toLocaleString("en-IN")}
              </strong>
              <small>
                {lostStage
                  ? formatCurrency(lostStage.pipeline_value)
                  : "No data"}
              </small>
            </div>
          </div>

          <div className="closure-bar">
            <span
              className="closure-won"
              style={{
                width: `${Number(summary.win_rate_pct || 0)}%`,
              }}
            />
          </div>

          <div className="closure-legend">
            <span>
              <i className="legend-dot won-dot" />
              Won
            </span>
            <span>
              <i className="legend-dot lost-dot" />
              Other / not won
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}
