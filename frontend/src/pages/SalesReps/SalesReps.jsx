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
  BarChart3,
  Check,
  RotateCcw,
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

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function SalesReps() {
  const [summary, setSummary] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [regionFilter, setRegionFilter] = useState("All");
  const [sortBy, setSortBy] = useState("revenue");
  const [searchTerm, setSearchTerm] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [draftRegion, setDraftRegion] = useState("All");
  const [draftSort, setDraftSort] = useState("revenue");

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
    const query = searchTerm.trim().toLowerCase();

    return performance
      .filter((rep) => {
        const regionMatch =
          regionFilter === "All" || rep.region === regionFilter;

        const searchMatch =
          !query ||
          rep.sales_rep_name.toLowerCase().includes(query) ||
          rep.region.toLowerCase().includes(query);

        return regionMatch && searchMatch;
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
  }, [performance, regionFilter, sortBy, searchTerm]);

  const revenueChartData = useMemo(
    () =>
      [...filteredPerformance]
        .sort((a, b) => Number(b.revenue) - Number(a.revenue))
        .slice(0, 8),
    [filteredPerformance],
  );

  const transactionChartData = useMemo(
    () =>
      [...filteredPerformance]
        .sort(
          (a, b) =>
            Number(b.closed_transactions) -
            Number(a.closed_transactions),
        )
        .slice(0, 8),
    [filteredPerformance],
  );

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
        (a, b) =>
          Number(b.closed_transactions) -
          Number(a.closed_transactions),
      )[0],
    [performance],
  );

  const maxRevenue = useMemo(
    () =>
      Math.max(
        ...performance.map((rep) => Number(rep.revenue || 0)),
        1,
      ),
    [performance],
  );

  const selectedRepRank = useMemo(() => {
    if (!selectedRep) return null;

    const ranked = [...performance].sort(
      (a, b) => Number(b.revenue) - Number(a.revenue),
    );

    return (
      ranked.findIndex(
        (rep) =>
          rep.sales_rep_name === selectedRep.sales_rep_name,
      ) + 1
    );
  }, [performance, selectedRep]);

  function openFilter() {
    setDraftRegion(regionFilter);
    setDraftSort(sortBy);
    setFilterOpen(true);
  }

  function applyFilter() {
    setRegionFilter(draftRegion);
    setSortBy(draftSort);
    setFilterOpen(false);
  }

  function resetFilter() {
    setDraftRegion("All");
    setDraftSort("revenue");
    setRegionFilter("All");
    setSortBy("revenue");
    setFilterOpen(false);
  }

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
          <div className="error-icon">!</div>
          <div>
            <span className="page-eyebrow">SALES DATA</span>
            <h2>Unable to load sales performance</h2>
            <p>{error}</p>
          </div>
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
          <strong>
            {formatCompactCurrency(summary.total_revenue)}
          </strong>
          <small>Revenue generated by the team</small>
        </article>

        <article className="sales-kpi-card sales-kpi-green">
          <div className="sales-kpi-icon">
            <ShoppingCart size={18} />
          </div>
          <span>Average revenue / rep</span>
          <strong>
            {formatCompactCurrency(
              summary.average_revenue_per_rep,
            )}
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
            aria-label="Search representatives"
          />
        </div>

        <div className="sales-toolbar-right">
          <div className="sales-active-filter">
            <span>View</span>
            <strong>
              {regionFilter === "All" ? "All regions" : regionFilter}
            </strong>
          </div>

          <button
            type="button"
            className="sales-filter-button"
            onClick={openFilter}
          >
            <SlidersHorizontal size={15} />
            Filter
          </button>
        </div>

        {filterOpen && (
          <div className="sales-filter-popover">
            <div className="sales-filter-popover-header">
              <div>
                <strong>Filter & sort</strong>
                <span>Control the performance view</span>
              </div>

              <button
                type="button"
                className="filter-close"
                onClick={() => setFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={16} />
              </button>
            </div>

            <div className="filter-section">
              <span className="filter-section-label">Region</span>

              <div className="filter-options">
                <button
                  type="button"
                  className={
                    draftRegion === "All"
                      ? "filter-option active"
                      : "filter-option"
                  }
                  onClick={() => setDraftRegion("All")}
                >
                  <span>All regions</span>
                  {draftRegion === "All" && (
                    <Check size={14} />
                  )}
                </button>

                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    className={
                      draftRegion === region
                        ? "filter-option active"
                        : "filter-option"
                    }
                    onClick={() => setDraftRegion(region)}
                  >
                    <span>{region}</span>
                    {draftRegion === region && (
                      <Check size={14} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <span className="filter-section-label">Sort by</span>

              <div className="filter-options">
                <button
                  type="button"
                  className={
                    draftSort === "revenue"
                      ? "filter-option active"
                      : "filter-option"
                  }
                  onClick={() => setDraftSort("revenue")}
                >
                  <span>Revenue</span>
                  {draftSort === "revenue" && (
                    <Check size={14} />
                  )}
                </button>

                <button
                  type="button"
                  className={
                    draftSort === "transactions"
                      ? "filter-option active"
                      : "filter-option"
                  }
                  onClick={() => setDraftSort("transactions")}
                >
                  <span>Transactions</span>
                  {draftSort === "transactions" && (
                    <Check size={14} />
                  )}
                </button>

                <button
                  type="button"
                  className={
                    draftSort === "name"
                      ? "filter-option active"
                      : "filter-option"
                  }
                  onClick={() => setDraftSort("name")}
                >
                  <span>Name</span>
                  {draftSort === "name" && (
                    <Check size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="filter-actions">
              <button
                type="button"
                className="filter-reset"
                onClick={resetFilter}
              >
                <RotateCcw size={13} />
                Reset
              </button>

              <button
                type="button"
                className="filter-apply"
                onClick={applyFilter}
              >
                Apply filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="region-chips">
        <button
          type="button"
          className={
            regionFilter === "All"
              ? "region-chip active"
              : "region-chip"
          }
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
                regionFilter === region
                  ? "region-chip active"
                  : "region-chip"
              }
              onClick={() => setRegionFilter(region)}
            >
              {region}
              <span>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="sales-chart-grid">
        <article className="analytics-panel sales-chart-panel">
          <div className="panel-heading sales-panel-title">
            <div>
              <div className="panel-heading-title">
                <BarChart3 size={16} />
                <h2>Revenue leaderboard</h2>
              </div>
              <p>Top representatives by revenue</p>
            </div>

            <span className="panel-count">
              Top {Math.min(revenueChartData.length, 8)}
            </span>
          </div>

          <div className="sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueChartData}
                layout="vertical"
                margin={{
                  top: 4,
                  right: 18,
                  left: 12,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  stroke="#eef1f5"
                  strokeDasharray="4 5"
                  horizontal={false}
                />

                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#98a2b3",
                    fontSize: 9,
                  }}
                  tickFormatter={formatCompactCurrency}
                />

                <YAxis
                  type="category"
                  dataKey="sales_rep_name"
                  width={82}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#667085",
                    fontSize: 9,
                  }}
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
                  radius={[0, 6, 6, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="analytics-panel sales-chart-panel">
          <div className="panel-heading sales-panel-title">
            <div>
              <div className="panel-heading-title">
                <ShoppingCart size={16} />
                <h2>Transaction volume</h2>
              </div>
              <p>Closed transactions by representative</p>
            </div>

            <span className="panel-count">
              {filteredPerformance.length} reps
            </span>
          </div>

          <div className="sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={transactionChartData}
                margin={{
                  top: 4,
                  right: 18,
                  left: 8,
                  bottom: 4,
                }}
              >
                <CartesianGrid
                  stroke="#eef1f5"
                  strokeDasharray="4 5"
                  vertical={false}
                />

                <XAxis
                  dataKey="sales_rep_name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#98a2b3",
                    fontSize: 8,
                  }}
                  interval={0}
                />

                <YAxis
                  width={34}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#98a2b3",
                    fontSize: 9,
                  }}
                  allowDecimals={false}
                />

                <Tooltip
                  formatter={(value) => [
                    `${value} transactions`,
                    "Transactions",
                  ]}
                  contentStyle={{
                    border: "1px solid #e4e7ec",
                    borderRadius: "10px",
                    boxShadow:
                      "0 12px 28px rgba(16, 24, 40, 0.10)",
                  }}
                />

                <Bar
                  dataKey="closed_transactions"
                  fill="#1570ef"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={34}
                />
              </BarChart>
            </ResponsiveContainer>
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
                      selectedRep?.sales_rep_name ===
                      rep.sales_rep_name
                        ? "selected-row"
                        : ""
                    }
                  >
                    <td>
                      <div className="rep-name-cell">
                        <div className="rep-avatar">
                          {getInitials(rep.sales_rep_name)}
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
                              width: `${Math.min(
                                contribution * 5,
                                100,
                              )}%`,
                            }}
                          />
                        </div>

                        <span>{contribution.toFixed(1)}%</span>
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
                Try another search or change the active filter.
              </span>
            </div>
          )}
        </div>
      </article>

      {selectedRep && (
        <div
          className="rep-drawer-backdrop"
          onClick={() => setSelectedRep(null)}
        >
          <aside
            className="rep-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="rep-drawer-header">
              <div>
                <span className="page-eyebrow">
                  REPRESENTATIVE PROFILE
                </span>

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
                {getInitials(selectedRep.sales_rep_name)}
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
                      Math.max(
                        Number(summary.total_revenue),
                        1,
                      )) *
                    100
                  ).toFixed(1)}
                  %
                </strong>
              </div>
            </div>

            <div className="rep-drawer-chart">
              <div className="drawer-section-title">
                <span>Revenue position</span>

                <strong>
                  {formatCompactCurrency(selectedRep.revenue)}
                </strong>
              </div>

              <div className="drawer-progress">
                <span
                  style={{
                    width: `${
                      (Number(selectedRep.revenue) /
                        maxRevenue) *
                      100
                    }%`,
                  }}
                />
              </div>

              <p>
                Compared with the highest-revenue representative in
                the current dataset.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
