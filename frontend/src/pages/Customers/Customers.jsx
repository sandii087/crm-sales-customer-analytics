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

  return `₹${amount}`;
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

  const topSegment = [...segments].sort(
    (a, b) => Number(b.revenue) - Number(a.revenue),
  )[0];

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
        <article className="metric-card metric-indigo">
          <span>Customers with Revenue</span>
          <strong>{totalCustomers.toLocaleString("en-IN")}</strong>
          <small>Across active customer segments</small>
        </article>

        <article className="metric-card metric-blue">
          <span>Customer Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>Total revenue attributed to customers</small>
        </article>

        <article className="metric-card metric-green">
          <span>Leading Segment</span>
          <strong>{topSegment?.segment ?? "—"}</strong>
          <small>
            {topSegment ? formatCurrency(topSegment.revenue) : "No data"}
          </small>
        </article>

        <article className="metric-card metric-amber">
          <span>Segments</span>
          <strong>{segments.length}</strong>
          <small>Customer segments in the CRM model</small>
        </article>
      </div>

      <div className="overview-grid">
        <article className="analytics-panel">
          <div className="panel-title">
            <div>
              <div className="panel-heading-title">
                <h2>Revenue by customer segment</h2>
              </div>
              <p>Compare segment-level revenue contribution</p>
            </div>

            <span className="panel-count">
              {segments.length} segments
            </span>
          </div>

          <div className="overview-chart" style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={segments}
                margin={{
                  top: 14,
                  right: 22,
                  left: 18,
                  bottom: 12,
                }}
              >
                <CartesianGrid
                  stroke="#eef1f5"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="segment"
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
                  cursor={{
                    fill: "rgba(91, 91, 214, 0.04)",
                  }}
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
                  maxBarSize={72}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="panel-title">
            <div>
              <div className="panel-heading-title">
                <h2>Segment summary</h2>
              </div>
              <p>Customer count and transaction value</p>
            </div>
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
                    <td>
                      <strong>{segment.segment}</strong>
                    </td>
                    <td>
                      {Number(segment.customers).toLocaleString("en-IN")}
                    </td>
                    <td>
                      {formatCurrency(segment.avg_transaction_value)}
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
          {topSegment?.segment ?? "Customer"} is the largest
          revenue-contributing customer segment.
        </h2>

        <p>
          Customer segment performance is available above for revenue,
          customer count, and average transaction analysis.
        </p>
      </article>
    </section>
  );
}
