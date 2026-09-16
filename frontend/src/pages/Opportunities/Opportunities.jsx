import { useEffect, useMemo, useState } from "react";
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
  }).format(value);
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

  const chartData = useMemo(() => {
    return stageOrder
      .map((stage) => funnel.find((item) => item.stage === stage))
      .filter(Boolean);
  }, [funnel]);

  if (loading) {
    return (
      <div className="empty-state">
        <h2>Loading opportunity analytics</h2>
        <p>Fetching live pipeline data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>Unable to load opportunity analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">OPPORTUNITY ANALYTICS</p>
          <h1>Sales Pipeline</h1>
          <p>
            Monitor opportunity volume, pipeline value, win rate, and
            stage distribution across the CRM.
          </p>
        </div>
      </div>

      <div className="overview-kpis">
        <article className="metric-card">
          <span>Total Opportunities</span>
          <strong>{summary.total_opportunities}</strong>
          <small>All recorded opportunities</small>
        </article>

        <article className="metric-card">
          <span>Won Opportunities</span>
          <strong>{summary.won_opportunities}</strong>
          <small>Successfully closed deals</small>
        </article>

        <article className="metric-card">
          <span>Win Rate</span>
          <strong>{summary.win_rate_pct}%</strong>
          <small>Won opportunities / total opportunities</small>
        </article>

        <article className="metric-card">
          <span>Total Pipeline</span>
          <strong>
            {formatCurrency(summary.total_pipeline_value)}
          </strong>
          <small>Value across all opportunities</small>
        </article>
      </div>

      <div className="overview-grid">
        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Pipeline by Stage</h2>
            <p>Opportunity value across the sales funnel</p>
          </div>

          <div className="overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar
                  dataKey="pipeline_value"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Pipeline Summary</h2>
            <p>Key commercial pipeline metrics</p>
          </div>

          <div className="funnel-list">
            <div className="funnel-row">
              <div className="funnel-label">
                <strong>Total Pipeline</strong>
                <span>All opportunity stages</span>
              </div>
              <div className="funnel-value">
                {formatCurrency(summary.total_pipeline_value)}
              </div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">
                <strong>Won Pipeline</strong>
                <span>Value of won opportunities</span>
              </div>
              <div className="funnel-value">
                {formatCurrency(summary.won_pipeline_value)}
              </div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">
                <strong>Lost Opportunities</strong>
                <span>Opportunities marked lost</span>
              </div>
              <div className="funnel-value">
                {summary.lost_opportunities}
              </div>
            </div>

            <div className="funnel-row">
              <div className="funnel-label">
                <strong>Win Rate</strong>
                <span>Overall conversion to won</span>
              </div>
              <div className="funnel-value">
                {summary.win_rate_pct}%
              </div>
            </div>
          </div>
        </article>
      </div>

      <article className="analytics-panel">
        <div className="panel-title">
          <h2>Stage Detail</h2>
          <p>Opportunity count and pipeline value by stage</p>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stage</th>
                <th>Opportunities</th>
                <th>Pipeline Value</th>
              </tr>
            </thead>

            <tbody>
              {chartData.map((stage) => (
                <tr key={stage.stage}>
                  <td>{stage.stage}</td>
                  <td>{stage.opportunities}</td>
                  <td>{formatCurrency(stage.pipeline_value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <article className="analytics-panel insight-panel">
        <p className="page-eyebrow">BUSINESS SNAPSHOT</p>
        <h2>
          The current opportunity win rate is {summary.win_rate_pct}%.
        </h2>
        <p>
          Compare the size of the open pipeline with won opportunities to
          identify potential conversion opportunities and stage bottlenecks.
        </p>
      </article>
    </section>
  );
}
