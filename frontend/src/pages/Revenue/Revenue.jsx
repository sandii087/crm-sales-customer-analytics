import { useEffect, useMemo, useState } from "react";
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
import { revenueApi } from "../../services/revenueApi";
import {
  TrendingUp,
  MapPin,
  Package,
  ShoppingCart,
} from "lucide-react";

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

  if (amount >= 1000) {
    return `₹${Math.round(amount / 1000)}K`;
  }

  return `₹${Math.round(amount)}`;
}

export default function Revenue() {
  const [data, setData] = useState({
    trend: [],
    regions: [],
    products: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [regionFilter, setRegionFilter] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const [trend, regions, products] = await Promise.all([
          revenueApi.getTrend(),
          revenueApi.getRegions(),
          revenueApi.getProducts(),
        ]);

        setData({ trend, regions, products });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredRegions = useMemo(() => {
    if (regionFilter === "All") {
      return data.regions;
    }

    return data.regions.filter(
      (item) => item.region === regionFilter,
    );
  }, [data.regions, regionFilter]);

  const totalRevenue = data.regions.reduce(
    (sum, item) => sum + Number(item.revenue),
    0,
  );

  const totalTransactions = data.regions.reduce(
    (sum, item) => sum + Number(item.transactions),
    0,
  );

  const bestRegion =
    data.regions.length > 0
      ? [...data.regions].sort(
          (a, b) => Number(b.revenue) - Number(a.revenue),
        )[0]
      : null;

  const bestProduct =
    data.products.length > 0
      ? [...data.products].sort(
          (a, b) => Number(b.revenue) - Number(a.revenue),
        )[0]
      : null;

  if (loading) {
    return (
      <section className="revenue-page">
        <div className="dashboard-loading">
          <div className="loading-orb" />
          <h2>Preparing revenue analytics</h2>
          <p>Fetching live revenue data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="revenue-page">
        <div className="dashboard-error">
          <div className="error-icon">!</div>
          <div>
            <span className="page-eyebrow">REVENUE DATA</span>
            <h2>Unable to load revenue analytics</h2>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="revenue-page">
      <div className="page-header revenue-header">
        <div>
          <span className="page-eyebrow">REVENUE ANALYTICS</span>
          <h1>Revenue performance</h1>
          <p>
            Analyze revenue trends, regional performance, transaction
            volume, and product contribution.
          </p>
        </div>

        <div className="revenue-filter-control">
          <label htmlFor="region-filter">Region</label>

          <select
            id="region-filter"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
          >
            <option value="All">All regions</option>

            {data.regions.map((item) => (
              <option key={item.region} value={item.region}>
                {item.region}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overview-kpis">
        <article className="metric-card metric-indigo">
          <div className="metric-topline">
            <div className="metric-icon">
              <TrendingUp size={17} />
            </div>

            <span className="metric-live">
              <span />
              Live
            </span>
          </div>

          <span className="metric-label">Total revenue</span>
          <strong>{formatCompactCurrency(totalRevenue)}</strong>
          <small>Across all recorded transactions</small>
        </article>

        <article className="metric-card metric-blue">
          <div className="metric-topline">
            <div className="metric-icon">
              <ShoppingCart size={17} />
            </div>

            <span className="metric-live">
              <span />
              Live
            </span>
          </div>

          <span className="metric-label">Transactions</span>
          <strong>{totalTransactions}</strong>
          <small>Completed sales transactions</small>
        </article>

        <article className="metric-card metric-green">
          <div className="metric-topline">
            <div className="metric-icon">
              <MapPin size={17} />
            </div>

            <span className="metric-live">
              <span />
              Region
            </span>
          </div>

          <span className="metric-label">Top region</span>
          <strong>{bestRegion?.region ?? "—"}</strong>

          <small>
            {bestRegion
              ? formatCurrency(bestRegion.revenue)
              : "No data"}
          </small>
        </article>

        <article className="metric-card metric-amber">
          <div className="metric-topline">
            <div className="metric-icon">
              <Package size={17} />
            </div>

            <span className="metric-live">
              <span />
              Product
            </span>
          </div>

          <span className="metric-label">Top product</span>
          <strong>{bestProduct?.product_name ?? "—"}</strong>

          <small>
            {bestProduct
              ? formatCurrency(bestProduct.revenue)
              : "No data"}
          </small>
        </article>
      </div>

      <div className="overview-grid">
        <article className="analytics-panel revenue-chart-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-heading-title">
                <TrendingUp size={16} />
                <h2>Monthly revenue</h2>
              </div>

              <p>Net revenue by transaction month</p>
            </div>

            <span className="panel-count">
              {data.trend.length} periods
            </span>
          </div>

          <div className="revenue-overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trend}
                margin={{
                  top: 12,
                  right: 24,
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
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#667085",
                    fontSize: 10,
                  }}
                  dy={8}
                />

                <YAxis
                  width={70}
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
                />

                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#5b5bd6"
                  strokeWidth={3}
                  dot={{
                    r: 3,
                    fill: "#ffffff",
                    stroke: "#5b5bd6",
                    strokeWidth: 2,
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#5b5bd6",
                    stroke: "#ffffff",
                    strokeWidth: 3,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel revenue-region-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-heading-title">
                <MapPin size={16} />
                <h2>Regional revenue</h2>
              </div>

              <p>Compare regional revenue contribution</p>
            </div>
          </div>

          <div className="revenue-overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredRegions}
                margin={{
                  top: 12,
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
                  dataKey="region"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#667085",
                    fontSize: 10,
                  }}
                  dy={8}
                />

                <YAxis
                  width={68}
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
                />

                <Bar
                  dataKey="revenue"
                  fill="#5b5bd6"
                  radius={[7, 7, 0, 0]}
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="analytics-panel revenue-table-panel">
        <div className="panel-heading">
          <div>
            <div className="panel-heading-title">
              <Package size={16} />
              <h2>Product revenue performance</h2>
            </div>

            <p>Products ranked by net revenue generated</p>
          </div>

          <span className="panel-count">
            {data.products.length} products
          </span>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Transactions</th>
                <th>Revenue</th>
              </tr>
            </thead>

            <tbody>
              {data.products.map((product) => (
                <tr key={product.product_name}>
                  <td>{product.product_name}</td>
                  <td>{product.category}</td>
                  <td>{product.transactions}</td>
                  <td>
                    <strong>{formatCurrency(product.revenue)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
