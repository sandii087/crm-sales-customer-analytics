import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { customerApi } from "../../services/customerApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Customers() {
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await customerApi.getSegments();
        setSegments(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="empty-state">
        <h2>Loading customer analytics</h2>
        <p>Fetching live customer data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>Unable to load customer analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  const totalCustomers = segments.reduce(
    (sum, item) => sum + Number(item.customers),
    0,
  );

  const totalRevenue = segments.reduce(
    (sum, item) => sum + Number(item.revenue),
    0,
  );

  const topSegment =
    [...segments].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">CUSTOMER ANALYTICS</p>
          <h1>Customer Intelligence</h1>
          <p>
            Understand customer segments, revenue contribution, and
            transaction value across the CRM portfolio.
          </p>
        </div>
      </div>

      <div className="overview-kpis">
        <article className="metric-card">
          <span>Customers with Revenue</span>
          <strong>{totalCustomers}</strong>
          <small>Across active customer segments</small>
        </article>

        <article className="metric-card">
          <span>Customer Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>Total revenue attributed to customers</small>
        </article>

        <article className="metric-card">
          <span>Leading Segment</span>
          <strong>{topSegment?.segment ?? "—"}</strong>
          <small>
            {topSegment
              ? formatCurrency(topSegment.revenue)
              : "No data"}
          </small>
        </article>

        <article className="metric-card">
          <span>Segments</span>
          <strong>{segments.length}</strong>
          <small>Customer segments in the CRM model</small>
        </article>
      </div>

      <div className="overview-grid">
        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Revenue by Customer Segment</h2>
            <p>Compare segment-level revenue contribution</p>
          </div>

          <div className="overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segments}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="segment" />
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

        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Segment Summary</h2>
            <p>Customer count and transaction value</p>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Customers</th>
                  <th>Avg. Transaction</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.segment}>
                    <td>{segment.segment}</td>
                    <td>{segment.customers}</td>
                    <td>
                      {formatCurrency(
                        segment.avg_transaction_value,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>

      <article className="analytics-panel insight-panel">
        <p className="page-eyebrow">BUSINESS SNAPSHOT</p>
        <h2>
          {topSegment?.segment} is the largest revenue-contributing
          customer segment.
        </h2>
        <p>
          This page can be extended with customer-level drill-down,
          industry analysis, acquisition channels, and retention metrics.
        </p>
      </article>
    </section>
  );
}
