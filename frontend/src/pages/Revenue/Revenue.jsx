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

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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
      ? [...data.regions].sort((a, b) => b.revenue - a.revenue)[0]
      : null;

  const bestProduct =
    data.products.length > 0
      ? [...data.products].sort((a, b) => b.revenue - a.revenue)[0]
      : null;

  if (loading) {
    return (
      <div className="empty-state">
        <h2>Loading revenue analytics</h2>
        <p>Fetching live revenue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>Unable to load revenue analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section>
      <div className="page-header revenue-header">
        <div>
          <p className="page-eyebrow">REVENUE ANALYTICS</p>
          <h1>Revenue Performance</h1>
          <p>
            Analyze revenue trends, regional performance, transaction
            volume, and product contribution.
          </p>
        </div>

        <div className="filter-group">
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
        <article className="metric-card">
          <span>Total Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>Across all recorded transactions</small>
        </article>

        <article className="metric-card">
          <span>Transactions</span>
          <strong>{totalTransactions}</strong>
          <small>Completed sales transactions</small>
        </article>

        <article className="metric-card">
          <span>Top Region</span>
          <strong>{bestRegion?.region ?? "—"}</strong>
          <small>
            {bestRegion
              ? formatCurrency(bestRegion.revenue)
              : "No data"}
          </small>
        </article>

        <article className="metric-card">
          <span>Top Product</span>
          <strong>{bestProduct?.product_name ?? "—"}</strong>
          <small>
            {bestProduct
              ? formatCurrency(bestProduct.revenue)
              : "No data"}
          </small>
        </article>
      </div>

      <div className="overview-grid">
        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Monthly Revenue</h2>
            <p>Net revenue by transaction month</p>
          </div>

          <div className="overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Regional Revenue</h2>
            <p>Compare regional revenue contribution</p>
          </div>

          <div className="overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredRegions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="region" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="analytics-panel revenue-table-panel">
        <div className="panel-title">
          <h2>Product Revenue Performance</h2>
          <p>Products ranked by net revenue generated</p>
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
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
