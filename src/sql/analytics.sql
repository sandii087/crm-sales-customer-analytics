USE crm_sales_analytics;

-- 1. Executive KPIs
SELECT
    ROUND(SUM(net_revenue), 2) AS total_revenue,
    COUNT(DISTINCT customer_id) AS active_customers,
    COUNT(*) AS total_transactions,
    ROUND(AVG(net_revenue), 2) AS average_transaction_value
FROM sales_transactions;


-- 2. Revenue by region
SELECT
    c.region,
    ROUND(SUM(t.net_revenue), 2) AS revenue,
    COUNT(t.transaction_id) AS transactions
FROM sales_transactions t
JOIN customers c
    ON t.customer_id = c.customer_id
GROUP BY c.region
ORDER BY revenue DESC;


-- 3. Revenue by product
SELECT
    p.product_name,
    p.category,
    ROUND(SUM(t.net_revenue), 2) AS revenue,
    COUNT(t.transaction_id) AS transactions
FROM sales_transactions t
JOIN products p
    ON t.product_id = p.product_id
GROUP BY p.product_id, p.product_name, p.category
ORDER BY revenue DESC;


-- 4. Sales representative performance
SELECT
    sr.sales_rep_name,
    sr.region,
    COUNT(t.transaction_id) AS closed_transactions,
    ROUND(SUM(t.net_revenue), 2) AS revenue
FROM sales_transactions t
JOIN sales_reps sr
    ON t.sales_rep_id = sr.sales_rep_id
GROUP BY sr.sales_rep_id, sr.sales_rep_name, sr.region
ORDER BY revenue DESC;


-- 5. Sales funnel
SELECT
    stage,
    COUNT(*) AS opportunities,
    ROUND(SUM(deal_size), 2) AS pipeline_value
FROM opportunities
GROUP BY stage
ORDER BY pipeline_value DESC;


-- 6. Opportunity conversion metrics
SELECT
    COUNT(*) AS total_opportunities,
    SUM(stage = 'Won') AS won_opportunities,
    ROUND(
        100 * SUM(stage = 'Won') / COUNT(*),
        2
    ) AS win_rate_pct,
    ROUND(SUM(deal_size), 2) AS total_pipeline_value,
    ROUND(
        SUM(CASE WHEN stage = 'Won' THEN deal_size ELSE 0 END),
        2
    ) AS won_pipeline_value
FROM opportunities;


-- 7. Revenue trend by month
SELECT
    DATE_FORMAT(transaction_date, '%Y-%m') AS month,
    ROUND(SUM(net_revenue), 2) AS revenue,
    COUNT(*) AS transactions
FROM sales_transactions
GROUP BY DATE_FORMAT(transaction_date, '%Y-%m')
ORDER BY month;


-- 8. Customer segment performance
SELECT
    c.segment,
    COUNT(DISTINCT c.customer_id) AS customers,
    ROUND(SUM(t.net_revenue), 2) AS revenue,
    ROUND(AVG(t.net_revenue), 2) AS avg_transaction_value
FROM customers c
JOIN sales_transactions t
    ON c.customer_id = t.customer_id
GROUP BY c.segment
ORDER BY revenue DESC;
