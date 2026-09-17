import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarRange,
  CircleCheck,
  Gauge,
  Layers3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { aiApi } from "../../services/aiApi";

function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatCompactCurrency(value) {
  const number = Number(value);

  if (number >= 10000000) {
    return `₹${(number / 10000000).toFixed(1)}Cr`;
  }

  if (number >= 100000) {
    return `₹${(number / 100000).toFixed(1)}L`;
  }

  if (number >= 1000) {
    return `₹${(number / 1000).toFixed(0)}K`;
  }

  return `₹${Math.round(number)}`;
}

function formatWeek(value) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function AI() {
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metric, setMetric] = useState("revenue");

  useEffect(() => {
    const loadForecast = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await aiApi.getBusinessForecast();

        if (data.status !== "success") {
          throw new Error(
            data.message || "Unable to load business forecast"
          );
        }

        setForecast(data.forecast || []);
      } catch (err) {
        setError(
          err.message || "Unable to load AI business forecast"
        );
      } finally {
        setLoading(false);
      }
    };

    loadForecast();
  }, []);

  const summary = useMemo(() => {
    if (!forecast.length) {
      return {
        revenueTotal: 0,
        profitTotal: 0,
        revenueAverage: 0,
        profitAverage: 0,
        marginAverage: 0,
        highestRevenue: null,
        highestProfit: null,
        lowestRevenue: null,
      };
    }

    const revenueTotal = forecast.reduce(
      (sum, item) =>
        sum + Number(item.forecast_net_revenue),
      0
    );

    const profitTotal = forecast.reduce(
      (sum, item) =>
        sum + Number(item.forecast_gross_profit),
      0
    );

    const marginAverage =
      forecast.reduce(
        (sum, item) =>
          sum + Number(item.forecast_gross_margin_pct),
        0
      ) / forecast.length;

    const highestRevenue = forecast.reduce(
      (best, item) =>
        Number(item.forecast_net_revenue) >
        Number(best.forecast_net_revenue)
          ? item
          : best
    );

    const highestProfit = forecast.reduce(
      (best, item) =>
        Number(item.forecast_gross_profit) >
        Number(best.forecast_gross_profit)
          ? item
          : best
    );

    const lowestRevenue = forecast.reduce(
      (lowest, item) =>
        Number(item.forecast_net_revenue) <
        Number(lowest.forecast_net_revenue)
          ? item
          : lowest
    );

    return {
      revenueTotal,
      profitTotal,
      revenueAverage: revenueTotal / forecast.length,
      profitAverage: profitTotal / forecast.length,
      marginAverage,
      highestRevenue,
      highestProfit,
      lowestRevenue,
    };
  }, [forecast]);

  const chartData = forecast.map((item) => ({
    week: formatWeek(item.week),
    revenue: Number(item.forecast_net_revenue),
    profit: Number(item.forecast_gross_profit),
    margin: Number(item.forecast_gross_margin_pct),
  }));

  const activeChartData = chartData.map((item) => ({
    ...item,
    value:
      metric === "revenue"
        ? item.revenue
        : metric === "profit"
          ? item.profit
          : item.margin,
  }));

  const chartTitle =
    metric === "revenue"
      ? "Expected Net Revenue"
      : metric === "profit"
        ? "Expected Gross Profit"
        : "Expected Gross Margin";

  const chartDescription =
    metric === "revenue"
      ? "Weekly revenue projection based on historical CRM patterns"
      : metric === "profit"
        ? "Projected gross profit derived from forecast revenue and predicted margin"
        : "Projected gross margin based on historical profitability patterns";

  if (error) {
    return (
      <div className="page-frame ai-page">
        <div className="ai-error-state">
          <div className="ai-error-icon">
            <Brain size={24} />
          </div>
          <h2>AI business forecast unavailable</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-frame ai-page">
      <section className="ai-hero">
        <div className="ai-hero-glow" />

        <div className="ai-hero-content">
          <div className="ai-hero-copy">
            <div className="ai-eyebrow">
              <Sparkles size={14} />
              AI SALES INTELLIGENCE
            </div>

            <h1>Business Forecast Command Center</h1>

            <p>
              Translate historical CRM performance into an
              8-week revenue, gross profit and margin outlook.
            </p>

            <div className="ai-hero-meta">
              <span>
                <CircleCheck size={14} />
                Forecast active
              </span>

              <span>
                <Layers3 size={14} />
                8-week horizon
              </span>

              <span>
                <Brain size={14} />
                Gradient Boosting
              </span>
            </div>
          </div>

          <div className="ai-model-panel">
            <div className="ai-model-panel-top">
              <div className="ai-model-icon">
                <Brain size={22} />
              </div>

              <div>
                <span>Current model</span>
                <strong>Gradient Boosting</strong>
              </div>
            </div>

            <div className="ai-model-status">
              <span className="ai-status-dot" />
              Production forecast
            </div>
          </div>
        </div>
      </section>

      <section className="ai-kpi-grid">
        <div className="ai-kpi-card ai-kpi-revenue">
          <div className="ai-kpi-top">
            <div className="ai-kpi-icon">
              <TrendingUp size={19} />
            </div>

            <span className="ai-kpi-badge">8 WEEKS</span>
          </div>

          <span className="ai-kpi-label">
            Forecast Revenue
          </span>

          <strong>
            {loading
              ? "—"
              : formatCompactCurrency(summary.revenueTotal)}
          </strong>

          <div className="ai-kpi-foot">
            <span>
              Avg. {formatCompactCurrency(summary.revenueAverage)}
            </span>

            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="ai-kpi-card ai-kpi-profit">
          <div className="ai-kpi-top">
            <div className="ai-kpi-icon">
              <Activity size={19} />
            </div>

            <span className="ai-kpi-badge">GROSS</span>
          </div>

          <span className="ai-kpi-label">
            Forecast Gross Profit
          </span>

          <strong>
            {loading
              ? "—"
              : formatCompactCurrency(summary.profitTotal)}
          </strong>

          <div className="ai-kpi-foot">
            <span>
              Avg. {formatCompactCurrency(summary.profitAverage)}
            </span>

            <ArrowUpRight size={15} />
          </div>
        </div>

        <div className="ai-kpi-card ai-kpi-margin">
          <div className="ai-kpi-top">
            <div className="ai-kpi-icon">
              <Gauge size={19} />
            </div>

            <span className="ai-kpi-badge">OUTLOOK</span>
          </div>

          <span className="ai-kpi-label">
            Average Gross Margin
          </span>

          <strong>
            {loading
              ? "—"
              : `${summary.marginAverage.toFixed(1)}%`}
          </strong>

          <div className="ai-kpi-foot">
            <span>Predicted across horizon</span>
          </div>
        </div>

        <div className="ai-kpi-card ai-kpi-horizon">
          <div className="ai-kpi-top">
            <div className="ai-kpi-icon">
              <CalendarRange size={19} />
            </div>

            <span className="ai-kpi-badge">MODEL</span>
          </div>

          <span className="ai-kpi-label">
            Forecast Horizon
          </span>

          <strong>8 Weeks</strong>

          <div className="ai-kpi-foot">
            <span>Weekly business outlook</span>
          </div>
        </div>
      </section>

      <section className="ai-main-grid">
        <div className="card ai-forecast-card">
          <div className="ai-card-heading">
            <div>
              <span className="ai-section-kicker">
                FORECAST TREND
              </span>

              <h2>{chartTitle}</h2>

              <p>{chartDescription}</p>
            </div>

            <div className="ai-metric-switcher">
              <button
                type="button"
                className={
                  metric === "revenue" ? "active" : ""
                }
                onClick={() => setMetric("revenue")}
              >
                Revenue
              </button>

              <button
                type="button"
                className={
                  metric === "profit" ? "active" : ""
                }
                onClick={() => setMetric("profit")}
              >
                Profit
              </button>

              <button
                type="button"
                className={
                  metric === "margin" ? "active" : ""
                }
                onClick={() => setMetric("margin")}
              >
                Margin
              </button>
            </div>
          </div>

          <div className="ai-chart-wrap">
            {loading ? (
              <div className="ai-loading-state">
                <div className="ai-loading-spinner" />
                <span>Loading business forecast…</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={390}>
                <ComposedChart
                  data={activeChartData}
                  margin={{
                    top: 15,
                    right: 18,
                    left: 8,
                    bottom: 10,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="aiRevenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2563eb"
                        stopOpacity={0.22}
                      />

                      <stop
                        offset="100%"
                        stopColor="#2563eb"
                        stopOpacity={0.02}
                      />
                    </linearGradient>

                    <linearGradient
                      id="aiProfitFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#16a34a"
                        stopOpacity={0.18}
                      />

                      <stop
                        offset="100%"
                        stopColor="#16a34a"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="#e8edf3"
                    strokeDasharray="4 4"
                  />

                  <XAxis
                    dataKey="week"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#7a8797", fontSize: 12 }}
                  />

                  {metric === "margin" ? (
                    <YAxis
                      width={58}
                      domain={[0, 100]}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#7a8797", fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                    />
                  ) : (
                    <YAxis
                      width={72}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#7a8797", fontSize: 12 }}
                      tickFormatter={(value) =>
                        formatCompactCurrency(value)
                      }
                    />
                  )}

                  <Tooltip
                    contentStyle={{
                      border: "1px solid #e6ebf1",
                      borderRadius: 12,
                      boxShadow:
                        "0 12px 28px rgba(15, 23, 42, 0.10)",
                    }}
                    formatter={(value) => [
                      metric === "margin"
                        ? `${Number(value).toFixed(2)}%`
                        : formatCurrency(value),
                      chartTitle,
                    ]}
                  />

                  {metric === "revenue" && (
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={3}
                      fill="url(#aiRevenueFill)"
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}

                  {metric === "profit" && (
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#16a34a"
                      strokeWidth={3}
                      fill="url(#aiProfitFill)"
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}

                  {metric === "margin" && (
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#7c3aed"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 6 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <aside className="card ai-outlook-card">
          <div className="ai-card-heading compact">
            <div>
              <span className="ai-section-kicker">
                BUSINESS OUTLOOK
              </span>

              <h2>What the model sees</h2>
            </div>
          </div>

          <div className="ai-outlook-list">
            <div className="ai-outlook-item">
              <div className="ai-outlook-icon positive">
                <ArrowUpRight size={17} />
              </div>

              <div>
                <span>Peak revenue week</span>
                <strong>
                  {summary.highestRevenue
                    ? `${formatWeek(
                        summary.highestRevenue.week
                      )} · ${formatCurrency(
                        summary.highestRevenue
                          .forecast_net_revenue
                      )}`
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="ai-outlook-item">
              <div className="ai-outlook-icon positive">
                <Activity size={17} />
              </div>

              <div>
                <span>Peak gross profit</span>
                <strong>
                  {summary.highestProfit
                    ? `${formatWeek(
                        summary.highestProfit.week
                      )} · ${formatCurrency(
                        summary.highestProfit
                          .forecast_gross_profit
                      )}`
                    : "—"}
                </strong>
              </div>
            </div>

            <div className="ai-outlook-item">
              <div className="ai-outlook-icon caution">
                <ArrowDownRight size={17} />
              </div>

              <div>
                <span>Lowest projected revenue</span>
                <strong>
                  {summary.lowestRevenue
                    ? `${formatWeek(
                        summary.lowestRevenue.week
                      )} · ${formatCurrency(
                        summary.lowestRevenue
                          .forecast_net_revenue
                      )}`
                    : "—"}
                </strong>
              </div>
            </div>
          </div>

          <div className="ai-readiness-card">
            <div className="ai-readiness-icon">
              <Brain size={18} />
            </div>

            <div>
              <strong>Model readiness</strong>

              <p>
                Current history is suitable for the present
                Gradient Boosting workflow. Deep-learning
                forecasting remains gated until substantially
                more historical observations are available.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="card ai-table-card">
        <div className="ai-card-heading">
          <div>
            <span className="ai-section-kicker">
              FORECAST DETAIL
            </span>

            <h2>8-Week Business Outlook</h2>

            <p>
              Revenue, gross profit and expected margin by
              forecast period.
            </p>
          </div>

          <div className="ai-model-chip">
            <span className="ai-status-dot" />
            Live model output
          </div>
        </div>

        <div className="ai-table-wrapper">
          <table className="ai-table">
            <thead>
              <tr>
                <th>Week</th>
                <th>Net Revenue</th>
                <th>Gross Profit</th>
                <th>Gross Margin</th>
                <th>Business Signal</th>
              </tr>
            </thead>

            <tbody>
              {forecast.map((item) => {
                const margin = Number(
                  item.forecast_gross_margin_pct
                );

                const signal =
                  margin >= 70
                    ? "Strong margin"
                    : margin >= 60
                      ? "Healthy margin"
                      : "Watch margin";

                const signalClass =
                  margin >= 70
                    ? "strong"
                    : margin >= 60
                      ? "healthy"
                      : "watch";

                return (
                  <tr key={item.week}>
                    <td>
                      <strong>{formatWeek(item.week)}</strong>
                    </td>

                    <td>
                      {formatCurrency(
                        item.forecast_net_revenue
                      )}
                    </td>

                    <td>
                      {formatCurrency(
                        item.forecast_gross_profit
                      )}
                    </td>

                    <td>
                      <span className="ai-margin-value">
                        {margin.toFixed(2)}%
                      </span>
                    </td>

                    <td>
                      <span
                        className={`ai-signal ${signalClass}`}
                      >
                        {signal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ai-footnote">
        <Brain size={16} />

        <span>
          Forecasts are model-generated estimates based on the
          available CRM history. They describe expected
          patterns, not guaranteed future business results.
        </span>
      </section>
    </div>
  );
}
