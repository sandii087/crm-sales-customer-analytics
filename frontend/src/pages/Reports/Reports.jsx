import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Package,
  Map,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const API_BASE = "http://" + "127.0.0.1:8000";

async function getData(path) {
  const response = await fetch(`${API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function Reports() {
  const [kpis, setKpis] = useState(null);
  const [products, setProducts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [segments, setSegments] = useState([]);
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [kpiData, productData, regionData, segmentData, repData] =
        await Promise.all([
          getData("/api/dashboard/kpis"),
          getData("/api/dashboard/revenue-by-product"),
          getData("/api/dashboard/revenue-by-region"),
          getData("/api/dashboard/customer-segments"),
          getData("/api/dashboard/sales-reps"),
        ]);

      setKpis(kpiData);
      setProducts(productData);
      setRegions(regionData);
      setSegments(segmentData);
      setReps(repData);
    } catch (err) {
      setError(err.message || "Unable to load report data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((item) => ({
        name: item.product_name,
        revenue: item.revenue,
      }));
  }, [products]);

  const topRep = useMemo(() => {
    if (!reps.length) return null;
    return [...reps].sort((a, b) => b.revenue - a.revenue)[0];
  }, [reps]);

  const totalSegmentCustomers = useMemo(() => {
    return segments.reduce((sum, item) => sum + item.customer_count, 0);
  }, [segments]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const exportReport = () => {
    const report = {
      generated_at: new Date().toISOString(),
      kpis,
      products,
      regions,
      customer_segments: segments,
      sales_reps: reps,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crm-sales-analytics-report.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <RefreshCw size={22} />
          <h3>Loading reports</h3>
          <p>Preparing the latest CRM analytics.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <FileText size={22} />
          <h3>Unable to load reports</h3>
          <p>{error}</p>
          <button className="secondary-button" onClick={loadReports}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="page-eyebrow">ANALYTICS</div>
          <h1>Reports</h1>
          <p>
            Consolidated business performance across revenue, customers,
            products, regions, and sales.
          </p>
        </div>

        <button className="secondary-button" onClick={exportReport}>
          <Download size={16} />
          Export report
        </button>
      </div>

      <div className="overview-kpis">
        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={18} />
          </div>
          <div>
            <span>Total Revenue</span>
            <strong>{formatCurrency(kpis?.total_revenue)}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Users size={18} />
          </div>
          <div>
            <span>Active Customers</span>
            <strong>{kpis?.active_customers?.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Package size={18} />
          </div>
          <div>
            <span>Transactions</span>
            <strong>{kpis?.total_transactions?.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <BarChart3 size={18} />
          </div>
          <div>
            <span>Average Transaction</span>
            <strong>{formatCurrency(kpis?.average_transaction_value)}</strong>
          </div>
        </div>
      </div>

      <div className="overview-grid">
        <section className="analytics-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title">Top Products</div>
              <div className="panel-subtitle">
                Revenue contribution by product
              </div>
            </div>
          </div>

          <div className="overview-chart">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(value) =>
                    `₹${Math.round(value / 1000)}k`
                  }
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={125}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="analytics-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title">Regional Performance</div>
              <div className="panel-subtitle">
                Revenue and transaction distribution
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Region</th>
                  <th>Revenue</th>
                  <th>Transactions</th>
                </tr>
              </thead>
              <tbody>
                {regions.map((region) => (
                  <tr key={region.region}>
                    <td>
                      <div className="table-primary">
                        <Map size={15} />
                        {region.region}
                      </div>
                    </td>
                    <td>{formatCurrency(region.revenue)}</td>
                    <td>{region.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="overview-grid">
        <section className="analytics-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title">Customer Segments</div>
              <div className="panel-subtitle">
                Revenue concentration by segment
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Segment</th>
                  <th>Customers</th>
                  <th>Revenue</th>
                  <th>Avg. Transaction</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((segment) => (
                  <tr key={segment.segment}>
                    <td>{segment.segment}</td>
                    <td>{segment.customer_count}</td>
                    <td>{formatCurrency(segment.revenue)}</td>
                    <td>
                      {formatCurrency(segment.average_transaction_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="insight-panel">
            <strong>{totalSegmentCustomers}</strong>
            <span>
              customers represented across the current segments
            </span>
          </div>
        </section>

        <section className="analytics-panel">
          <div className="panel-heading">
            <div>
              <div className="panel-title">Sales Performance</div>
              <div className="panel-subtitle">
                Current revenue leader
              </div>
            </div>
          </div>

          {topRep && (
            <div className="report-highlight">
              <div className="report-highlight-icon">
                <Users size={22} />
              </div>

              <div>
                <span>Top Sales Representative</span>
                <h3>{topRep.rep_name}</h3>
                <strong>{formatCurrency(topRep.revenue)}</strong>
                <p>Revenue generated in the current dataset</p>
              </div>
            </div>
          )}

          <div className="report-stat-row">
            <span>Total representatives</span>
            <strong>{reps.length}</strong>
          </div>

          <div className="report-stat-row">
            <span>Average revenue / representative</span>
            <strong>
              {formatCurrency(
                reps.length
                  ? reps.reduce((sum, rep) => sum + rep.revenue, 0) /
                      reps.length
                  : 0
              )}
            </strong>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Reports;
