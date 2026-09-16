import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, text

app = FastAPI(
    title="CRM Sales & Customer Analytics API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@localhost:3306/crm_sales_analytics",
)

engine = create_engine(
    DB_URL,
    pool_pre_ping=True,
)


def fetch_all(query: str):
    with engine.connect() as connection:
        result = connection.execute(text(query))
        return [dict(row) for row in result.mappings().all()]


def fetch_one(query: str):
    with engine.connect() as connection:
        result = connection.execute(text(query))
        return dict(result.mappings().one())


@app.get("/")
def root():
    return {
        "application": "CRM Sales & Customer Analytics",
        "status": "running",
    }


@app.get("/api/dashboard/kpis")
def dashboard_kpis():
    return fetch_one("""
        SELECT
            ROUND(SUM(net_revenue), 2) AS total_revenue,
            COUNT(DISTINCT customer_id) AS active_customers,
            COUNT(*) AS total_transactions,
            ROUND(AVG(net_revenue), 2) AS average_transaction_value
        FROM sales_transactions
    """)


@app.get("/api/dashboard/revenue-by-region")
def revenue_by_region():
    return fetch_all("""
        SELECT
            c.region,
            ROUND(SUM(t.net_revenue), 2) AS revenue,
            COUNT(t.transaction_id) AS transactions
        FROM sales_transactions t
        JOIN customers c
            ON t.customer_id = c.customer_id
        GROUP BY c.region
        ORDER BY revenue DESC
    """)


@app.get("/api/dashboard/revenue-by-product")
def revenue_by_product():
    return fetch_all("""
        SELECT
            p.product_name,
            p.category,
            ROUND(SUM(t.net_revenue), 2) AS revenue,
            COUNT(t.transaction_id) AS transactions
        FROM sales_transactions t
        JOIN products p
            ON t.product_id = p.product_id
        GROUP BY p.product_id, p.product_name, p.category
        ORDER BY revenue DESC
    """)


@app.get("/api/dashboard/sales-reps")
def sales_reps():
    return fetch_all("""
        SELECT
            sr.sales_rep_name,
            sr.region,
            COUNT(t.transaction_id) AS closed_transactions,
            ROUND(SUM(t.net_revenue), 2) AS revenue
        FROM sales_transactions t
        JOIN sales_reps sr
            ON t.sales_rep_id = sr.sales_rep_id
        GROUP BY sr.sales_rep_id, sr.sales_rep_name, sr.region
        ORDER BY revenue DESC
    """)


@app.get("/api/dashboard/sales-reps-summary")
def sales_reps_summary():
    return fetch_one("""
        SELECT
            COUNT(*) AS total_reps,
            ROUND(SUM(rep_revenue), 2) AS total_revenue,
            ROUND(AVG(rep_revenue), 2) AS average_revenue_per_rep,
            ROUND(MAX(rep_revenue), 2) AS top_rep_revenue
        FROM (
            SELECT
                sales_rep_id,
                SUM(net_revenue) AS rep_revenue
            FROM sales_transactions
            GROUP BY sales_rep_id
        ) AS rep_summary
    """)


@app.get("/api/dashboard/funnel")
def funnel():
    return fetch_all("""
        SELECT
            stage,
            COUNT(*) AS opportunities,
            ROUND(SUM(deal_size), 2) AS pipeline_value
        FROM opportunities
        GROUP BY stage
        ORDER BY pipeline_value DESC
    """)


@app.get("/api/dashboard/opportunity-summary")
def opportunity_summary():
    return fetch_one("""
        SELECT
            COUNT(*) AS total_opportunities,
            SUM(stage = 'Won') AS won_opportunities,
            SUM(stage = 'Lost') AS lost_opportunities,
            ROUND(
                100 * SUM(stage = 'Won') / COUNT(*),
                2
            ) AS win_rate_pct,
            ROUND(SUM(deal_size), 2) AS total_pipeline_value,
            ROUND(
                SUM(
                    CASE
                        WHEN stage = 'Won' THEN deal_size
                        ELSE 0
                    END
                ),
                2
            ) AS won_pipeline_value
        FROM opportunities
    """)


@app.get("/api/dashboard/revenue-trend")
def revenue_trend():
    return fetch_all("""
        SELECT
            DATE_FORMAT(transaction_date, '%Y-%m') AS month,
            ROUND(SUM(net_revenue), 2) AS revenue,
            COUNT(*) AS transactions
        FROM sales_transactions
        GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
        ORDER BY month
    """)


@app.get("/api/dashboard/customer-segments")
def customer_segments():
    return fetch_all("""
        SELECT
            c.segment,
            COUNT(DISTINCT c.customer_id) AS customers,
            ROUND(SUM(t.net_revenue), 2) AS revenue,
            ROUND(AVG(t.net_revenue), 2) AS avg_transaction_value
        FROM customers c
        JOIN sales_transactions t
            ON c.customer_id = t.customer_id
        GROUP BY c.segment
        ORDER BY revenue DESC
    """)
