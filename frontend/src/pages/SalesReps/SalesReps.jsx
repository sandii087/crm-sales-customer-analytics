import { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Users,
  CircleDollarSign,
  ShoppingCart,
  Trophy,
  MapPin,
  ChevronRight,
  X,
  TrendingUp,
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
import { salesRepApi } from "../../services/salesRepApi";

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

export default function SalesReps() {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [regionFilter, setRegionFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("revenue");
  const [selectedRep, setSelectedRep] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [summaryResult, performanceResult] = await Promise.all([
          salesRepApi.getSummary(),
          salesRepApi.getPerformance(),
        ]);

        setSummary(summaryResult);
        setPerformance(performanceResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const regions = useMemo(
    () => [...new Set(performance.map((rep) => rep.region))].sort(),
    [performance],
  );

  const filteredPerformance = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return performance
      .filter((rep) => {
        const matchesRegion =
          regionFilter === "All" || rep.region === regionFilter;

        const matchesSearch =
          !normalizedSearch ||
          rep.sales_rep_name.toLowerCase().includes(normalizedSearch) ||
          rep.region.toLowerCase().includes(normalizedSearch);

        return matchesRegion && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "transactions") {
          return b.closed_transactions - a.closed_transactions;
        }

        if (sortBy === "name") {
          return a.sales_rep_name.localeCompare(b.sales_rep_name);
        }

        return Number(b.revenue) - Number(a.revenue);
      });
  }, [performance, regionFilter, searchTerm, sortBy]);

  const topRep = useMemo(
    () =>
      [...performance].sort(
        (a, b) => Number(b.revenue) - Number(a.revenue),
      )[0],
    [performance],
  );

  const topTransactionsRep = useMemo(
    () =>
      [...performance].sort(
        (a, b) => b.closed_transactions - a.closed_transactions,
      )[0],
    [performance],
  );

  const maxRevenue = useMemo(
    () =>
      Math.max(...performance.map((rep) => Number(rep.revenue)), 1),
    [performance],
  );

  const selectedRepRank = useMemo(() => {
    if (!selectedRep) return null;

    return (
      [...performance]
        .sort((a, b) => Number(b.revenue) - Number(a.revenue))
        .findIndex(
          (rep) => rep.sales_rep_name === selectedRep.sales_rep_name,
        ) + 1
    );
  }, [performance, selectedRep]);

  if (loading) {
    return (
      <section className="sales-reps-page">
        <div className="dashboard-loading">
          <div className="loading-orb" />
          <h2>Preparing sales performance</h2>
          <p>Fetching live representative data...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="sales-reps-page">
        <div className="dashboard-error">
          <h2>Unable to load sales performance</h2>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="sales-reps-page">
      <div className="page-header sales-reps-header">
        <div>
          <span className="page-eyebrow">SALES OPERATIONS</span>
          <h1>Sales representative performance</h1>
          <p>
            Explore team productivity, revenue contribution, and regional
            coverage from the live CRM dataset.
          </p>
        </div>

        <div className="sales-period-badge">
          <TrendingUp size={15} />
          Live performance
        </div>
      </div>

      <div className="sales-kpis">
        <article className="sales-kpi-card sales-kpi-indigo">
          <div className="sales-kpi-icon">
            <Users size={18} />
          </div>
          <span>Total representatives</span>
          <strong>{summary.total_reps}</strong>
          <small>Representatives with recorded sales</small>
        </article>

        <article className="sales-kpi-card sales-kpi-blue">
          <div className="sales-kpi-icon">
            <CircleDollarSign size={18} />
          </div>
          <span>Team revenue</span>
          <strong>{formatCompactCurrency(summary.total_revenue)}</strong>
          <small>Revenue generated by the team</small>
        </article>

        <article className="sales-kpi-card sales-kpi-green">
          <div className="sales-kpi-icon">
            <ShoppingCart size={18} />
          </div>
          <span>Average revenue / rep</span>
          <strong>
            {formatCompactCurrency(summary.average_revenue_per_rep)}
          </strong>
          <small>Average representative contribution</small>
        </article>

        <article className="sales-kpi-card sales-kpi-amber">
          <div className="sales-kpi-icon">
            <Trophy size={18} />
          </div>
          <span>Revenue leader</span>
          <strong>{topRep?.sales_rep_name ?? "—"}</strong>
          <small>
            {topRep ? formatCurrency(topRep.revenue) : "No data"}
          </small>
        </article>
      </div>

      <div className="sales-toolbar">
        <div className="sales-search">
          <Search size={17} />
          <input
            type="search"
            placeholder="Search representative or region..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="sales-toolbar-right">
          <div className="sales-sort">
            <ArrowUpDown size={15} />
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort representatives"
            >
              <option value="revenue">Revenue</option>
              <option value="transactions">Transactions</option>
              <option value="name">Name</option>
            </select>
          </div>

          <div className="sales-filter-label">
            <SlidersHorizontal size={15} />
            Filter
          </div>
        </div>
      </div>

      <div className="region-chips">
        <button
          type="button"
          className={regionFilter === "All" ? "region-chip active" : "region-chip"}
          onClick={() => setRegionFilter("All")}
        >
          All regions
          <span>{performance.length}</span>
        </button>

        {regions.map((region) => {
          const count = performance.filter(
            (rep) => rep.region === region,
          ).length;

          return (
            <button
              key={region}
              type="button"
              className={
                regionFilter === region ? "region-chip active" : "region-chip"
              }
              onClick={() => setRegionFilter(region)}
            >
              {region}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sales-content-grid">
        <article className="analytics-panel sales-leaderboard-panel">
          <div className="panel-title sales-panel-title">
            <div>
              <div className="panel-heading-title">
                <Trophy size={16} />
                <h2>Revenue leaderboard</h2>
              </div>
              <p>Highest-performing representatives</p>
            </div>

            <span className="panel-count">
              {filteredPerformance.length} shown
            </span>
          </div>

          <div className="sales-leaderboard">
            {filteredPerformance.slice(0, 8).map((rep, index) => {
              const progress =
                (Number(rep.revenue) / maxRevenue) * 100;

              return (
                <button
                  key={rep.sales_rep_name}
                  type="button"
                  className="leaderboard-row"
                  onClick={() => setSelectedRep(rep)}
                >
                  <span className={`leader-rank rank-${index + 1}`}>
                    {index + 1}
                  </span>

                  <span className="leader-main">
                    <span className="leader-name">
                      {rep.sales_rep_name}
                    </span>
                    <span className="leader-meta">
                      <MapPin size={11} />
                      {rep.region}
                      <span>•</span>
                      {rep.closed_transactions} transactions
                    </span>

                    <span className="leader-progress">
                      <span style={{ width: `${progress}%` }} />
                    </span>
                  </span>

                  <span className="leader-value">
                    {formatCompactCurrency(rep.revenue)}
                    <ChevronRight size={15} />
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <article className="analytics-panel sales-insight-panel">
          <div className="panel-title sales-panel-title">
            <div>
              <div className="panel-heading-title">
                <TrendingUp size={16} />
                <h2>Team signals</h2>
              </div>
              <p>Current organization indicators</p>
            </div>
          </div>

          <div className="team-signal-list">
            <div className="team-signal">
              <span className="signal-label">Revenue leader</span>
              <strong>{topRep?.sales_rep_name ?? "—"}</strong>
              <small>
                {topRep ? formatCurrency(topRep.revenue) : "No data"}
              </small>
            </div>

            <div className="team-signal">
              <span className="signal-label">Transaction leader</span>
              <strong>
                {topTransactionsRep?.sales_rep_name ?? "—"}
              </strong>
              <small>
                {topTransactionsRep
                  ? `${topTransactionsRep.closed_transactions} transactions`
                  : "No data"}
              </small>
            </div>

            <div className="team-signal">
              <span className="signal-label">Regions covered</span>
              <strong>{regions.length}</strong>
              <small>Sales organization coverage</small>
            </div>
          </div>
        </article>
      </div>

      <article className="analytics-panel sales-performance-panel">
        <div className="panel-title sales-panel-title">
          <div>
            <div className="panel-heading-title">
              <Users size={16} />
              <h2>Representative performance</h2>
            </div>
            <p>
              Click any representative to inspect their contribution.
            </p>
          </div>

          <span className="panel-count">
            {filteredPerformance.length} representatives
          </span>
        </div>

        <div className="rep-table-wrap">
          <table className="rep-table">
            <thead>
              <tr>
                <th>Representative</th>
                <th>Region</th>
                <th>Transactions</th>
                <th>Revenue</th>
                <th>Contribution</th>
              </tr>
            </thead>

            <tbody>
              {filteredPerformance.map((rep) => {
                const contribution =
                  (Number(rep.revenue) /
                    Math.max(Number(summary.total_revenue), 1)) *
                  100;

                return (
                  <tr
                    key={rep.sales_rep_name}
                    onClick={() => setSelectedRep(rep)}
                    className={
                      selectedRep?.sales_rep_name === rep.sales_rep_name
                        ? "selected-row"
                        : ""
                    }
                  >
                    <td>
                      <div className="rep-name-cell">
                        <div className="rep-avatar">
                          {rep.sales_rep_name
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </div>

                        <div>
                          <strong>{rep.sales_rep_name}</strong>
                          <span>Sales representative</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="region-badge">
                        {rep.region}
                      </span>
                    </td>

                    <td>{rep.closed_transactions}</td>

                    <td>
                      <strong>{formatCurrency(rep.revenue)}</strong>
                    </td>

                    <td>
                      <div className="contribution-cell">
                        <div className="contribution-bar">
                          <span
                            style={{
                              width: `${Math.min(contribution * 5, 100)}%`,
                            }}
                          />
                        </div>
                        <span>
                          {contribution.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!filteredPerformance.length && (
            <div className="table-empty">
              <Search size={20} />
              <strong>No representatives found</strong>
              <span>
                Try another search term or remove the region filter.
              </span>
            </div>
          )}
        </div>
      </article>

      {selectedRep && (
        <div className="rep-drawer-backdrop" onClick={() => setSelectedRep(null)}>
          <aside
            className="rep-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rep-drawer-header">
              <div>
                <span className="page-eyebrow">REPRESENTATIVE PROFILE</span>
                <h2>{selectedRep.sales_rep_name}</h2>
              </div>

              <button
                type="button"
                className="drawer-close"
                onClick={() => setSelectedRep(null)}
                aria-label="Close representative details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rep-profile-card">
              <div className="rep-profile-avatar">
                {selectedRep.sales_rep_name
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </div>

              <div>
                <strong>{selectedRep.sales_rep_name}</strong>
                <span>
                  <MapPin size={12} />
                  {selectedRep.region}
                </span>
              </div>
            </div>

            <div className="rep-detail-grid">
              <div>
                <span>Revenue</span>
                <strong>
                  {formatCurrency(selectedRep.revenue)}
                </strong>
              </div>

              <div>
                <span>Transactions</span>
                <strong>{selectedRep.closed_transactions}</strong>
              </div>

              <div>
                <span>Team rank</span>
                <strong>#{selectedRepRank}</strong>
              </div>

              <div>
                <span>Team share</span>
                <strong>
                  {(
                    (Number(selectedRep.revenue) /
                      Math.max(Number(summary.total_revenue), 1)) *
                    100
                  ).toFixed(1)}
                  %
                </strong>
              </div>
            </div>

            <div className="rep-drawer-chart">
              <div className="drawer-section-title">
                <span>Revenue position</span>
                <strong>{formatCompactCurrency(selectedRep.revenue)}</strong>
              </div>

              <div className="drawer-progress">
                <span
                  style={{
                    width: `${
                      (Number(selectedRep.revenue) / maxRevenue) * 100
                    }%`,
                  }}
                />
              </div>

              <p>
                Compared with the highest-revenue representative in the
                current dataset.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
