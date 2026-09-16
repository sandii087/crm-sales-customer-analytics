import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  ShoppingCart,
  Users,
  Activity,
  MapPin,
  CalendarRange,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../../services/api";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const kpiConfig = [
  {
    key: "total_revenue",
    label: "Net revenue",
    helper: "Revenue after discounts",
    icon: CircleDollarSign,
    accent: "indigo",
    formatter: formatCompactCurrency,
  },
  {
    key: "active_customers",
    label: "Active customers",
    helper: "Customers with transactions",
    icon: Users,
    accent: "blue",
    formatter: (value) => value.toLocaleString("en-IN"),
  },
  {
    key: "total_transactions",
    label: "Transactions",
    helper: "Completed transactions",
    icon: ShoppingCart,
    accent: "emerald",
    formatter: (value) => value.toLocaleString("en-IN"),
  },
  {
    key: "average_transaction_value",
    label: "Average order value",
    helper: "Average net transaction",
    icon: BarChart3,
    accent: "amber",
    formatter: formatCompactCurrency,
  },
];

export default function Overview() {
  const [data, setData] = useState({
    kpis: null,
    trend: [],
    regions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [kpis, trend, regions] = await Promise.all([
          api.getKpis(),
          api.getRevenueTrend(),
          api.getRevenueByRegion(),
        ]);

        setData({
          kpis,
          trend,
          regions,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const topRegion = useMemo(() => {
    if (!data.regions.length) return null;

    return [...data.regions].sort(
      (a, b) => Number(b.revenue) - Number(a.revenue),
    )[0];
  }, [data.regions]);

  const coverageMonths = data.trend.length;

  if (loading) {
    return (
      <section className="overview-page">
        <div className="dashboard-loading">
          <div className="loading-orb" />
          <h2>Preparing your dashboard</h2>
          <p>Fetching live CRM performance data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="overview-page">
        <div className="dashboard-error">
          <div className="error-icon">!</div>
          <div>
            <span className="page-eyebrow">DATA CONNECTION</span>
            <h2>Unable to load dashboard</h2>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="overview-page">
      <div className="overview-heading">
        <div>
          <div className="overview-title-row">
            <div>
              <span className="page-eyebrow">EXECUTIVE OVERVIEW</span>
              <h1>Sales performance at a glance</h1>
              <p>
                A live view of revenue, customers, transactions, and regional
                performance.
              </p>
            </div>
          </div>
        </div>

        <div className="overview-period">
          <CalendarRange size={15} />
          <span>Last 12 months</span>
        </div>
      </div>

      <div className="overview-kpis">
        {kpiConfig.map(
          ({ key, label, helper, icon: Icon, accent, formatter }) => (
            <article className={`metric-card metric-${accent}`} key={key}>
              <div className="metric-topline">
                <div className="metric-icon">
                  <Icon size={17} strokeWidth={2} />
                </div>

                <span className="metric-live">
                  <span />
                  Live
                </span>
              </div>

              <span className="metric-label">{label}</span>

              <strong>{formatter(data.kpis[key])}</strong>

              <small>{helper}</small>
            </article>
          ),
        )}
      </div>

      <div className="overview-main-grid">
        <article className="analytics-panel revenue-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-heading-title">
                <Activity size={16} />
                <h2>Revenue trend</h2>
              </div>
              <p>Monthly net revenue performance</p>
            </div>

            <div className="panel-meta">
              {coverageMonths} periods
            </div>
          </div>

          <div className="overview-chart revenue-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trend}
                margin={{ top: 10, right: 14, left: -12, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#eef1f5"
                  strokeDasharray="4 5"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#98a2b3", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#98a2b3", fontSize: 10 }}
                  tickFormatter={(value) => formatCompactCurrency(value)}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    border: "1px solid #e4e7ec",
                    borderRadius: "10px",
                    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.10)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#5b5bd6"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 5,
                    strokeWidth: 3,
                    stroke: "#ffffff",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel region-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-heading-title">
                <MapPin size={16} />
                <h2>Regional performance</h2>
              </div>
              <p>Net revenue contribution by region</p>
            </div>
          </div>

          <div className="region-list">
            {data.regions
              .slice()
              .sort((a, b) => Number(b.revenue) - Number(a.revenue))
              .map((region, index) => {
                const revenue = Number(region.revenue);
                const maxRevenue = topRegion
                  ? Number(topRegion.revenue)
                  : revenue;

                const width =
                  maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;

                return (
                  <div className="region-row" key={region.region}>
                    <div className="region-row-top">
                      <div className="region-name-wrap">
                        <span className={`region-rank rank-${index + 1}`}>
                          {index + 1}
                        </span>
                        <strong>{region.region}</strong>
                      </div>

                      <span>{formatCompactCurrency(revenue)}</span>
                    </div>

                    <div className="region-track">
                      <div
                        className={`region-fill region-fill-${index + 1}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </article>
      </div>

      <div className="overview-bottom-grid">
        <article className="analytics-panel insight-panel">
          <div className="insight-icon">
            <ArrowUpRight size={19} />
          </div>

          <span className="page-eyebrow">BUSINESS SNAPSHOT</span>

          <h2>
            {topRegion
              ? `${topRegion.region} is currently the leading revenue region.`
              : "Regional performance is ready for analysis."}
          </h2>

          <p>
            Use the Revenue and Customers sections to investigate the drivers
            behind regional and customer performance.
          </p>
        </article>

        <article className="analytics-panel mini-summary">
          <div className="panel-heading">
            <div>
              <div className="panel-heading-title">
                <BarChart3 size={16} />
                <h2>Performance summary</h2>
              </div>
              <p>Current dataset coverage</p>
            </div>
          </div>

          <div className="summary-items">
            <div>
              <span>Revenue</span>
              <strong>{formatCurrency(data.kpis.total_revenue)}</strong>
            </div>

            <div>
              <span>Customers</span>
              <strong>
                {data.kpis.active_customers.toLocaleString("en-IN")}
              </strong>
            </div>

            <div>
              <span>Transactions</span>
              <strong>
                {data.kpis.total_transactions.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
