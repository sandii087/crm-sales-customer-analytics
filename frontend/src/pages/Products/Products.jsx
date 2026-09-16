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
import { productApi } from "../../services/productApi";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const result = await productApi.getPerformance();
        setProducts(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.product_name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalRevenue = products.reduce(
    (sum, product) => sum + Number(product.revenue),
    0,
  );

  const totalTransactions = products.reduce(
    (sum, product) => sum + Number(product.transactions),
    0,
  );

  const topProduct = products[0];

  const categoryPerformance = useMemo(() => {
    const grouped = {};

    products.forEach((product) => {
      if (!grouped[product.category]) {
        grouped[product.category] = {
          category: product.category,
          revenue: 0,
          transactions: 0,
        };
      }

      grouped[product.category].revenue += Number(product.revenue);
      grouped[product.category].transactions += Number(
        product.transactions,
      );
    });

    return Object.values(grouped).sort(
      (a, b) => b.revenue - a.revenue,
    );
  }, [products]);

  if (loading) {
    return (
      <div className="empty-state">
        <h2>Loading product analytics</h2>
        <p>Fetching live product performance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <h2>Unable to load product analytics</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <section>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">PRODUCT ANALYTICS</p>
          <h1>Product Performance</h1>
          <p>
            Analyze product revenue, transaction volume, and category
            contribution across the portfolio.
          </p>
        </div>
      </div>

      <div className="overview-kpis">
        <article className="metric-card">
          <span>Total Products</span>
          <strong>{products.length}</strong>
          <small>Products with recorded transactions</small>
        </article>

        <article className="metric-card">
          <span>Portfolio Revenue</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
          <small>Total revenue across products</small>
        </article>

        <article className="metric-card">
          <span>Total Transactions</span>
          <strong>{totalTransactions}</strong>
          <small>Recorded product transactions</small>
        </article>

        <article className="metric-card">
          <span>Top Product</span>
          <strong>{topProduct?.product_name ?? "—"}</strong>
          <small>
            {topProduct
              ? formatCurrency(topProduct.revenue)
              : "No data"}
          </small>
        </article>
      </div>

      <div className="overview-grid">
        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Product Revenue Ranking</h2>
            <p>Products ranked by revenue contribution</p>
          </div>

          <div className="overview-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={products.slice(0, 10)}
                layout="vertical"
                margin={{ left: 20, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="product_name"
                  width={125}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar
                  dataKey="revenue"
                  fill="#2563eb"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel">
          <div className="panel-title">
            <h2>Category Performance</h2>
            <p>Revenue contribution by product category</p>
          </div>

          <div className="funnel-list">
            {categoryPerformance.map((item) => (
              <div className="funnel-row" key={item.category}>
                <div className="funnel-label">
                  <strong>{item.category}</strong>
                  <span>{item.transactions} transactions</span>
                </div>

                <div className="funnel-value">
                  {formatCurrency(item.revenue)}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="analytics-panel">
        <div className="panel-title">
          <div>
            <h2>Product Catalogue Performance</h2>
            <p>
              Search and filter the live product performance dataset.
            </p>
          </div>

          <div className="filter-group product-filters">
            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="All">All categories</option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
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
              {filteredProducts.map((product) => (
                <tr key={product.product_name}>
                  <td>{product.product_name}</td>
                  <td>{product.category}</td>
                  <td>{product.transactions}</td>
                  <td>{formatCurrency(product.revenue)}</td>
                </tr>
              ))}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="4">No products match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      <article className="analytics-panel insight-panel">
        <p className="page-eyebrow">BUSINESS SNAPSHOT</p>
        <h2>
          {topProduct?.product_name} is currently the highest-revenue
          product.
        </h2>
        <p>
          Use product and category performance together to identify
          portfolio concentration and opportunities for growth.
        </p>
      </article>
    </section>
  );
}
