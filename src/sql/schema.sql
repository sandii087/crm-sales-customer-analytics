USE crm_sales_analytics;

DROP TABLE IF EXISTS sales_transactions;
DROP TABLE IF EXISTS opportunities;
DROP TABLE IF EXISTS leads;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS sales_reps;
DROP TABLE IF EXISTS customers;

CREATE TABLE customers (
    customer_id VARCHAR(20) PRIMARY KEY,
    region VARCHAR(30) NOT NULL,
    segment VARCHAR(30) NOT NULL,
    industry VARCHAR(50) NOT NULL,
    acquisition_channel VARCHAR(30) NOT NULL,
    signup_date DATE NOT NULL
);

CREATE TABLE sales_reps (
    sales_rep_id VARCHAR(20) PRIMARY KEY,
    sales_rep_name VARCHAR(100) NOT NULL,
    region VARCHAR(30) NOT NULL,
    team VARCHAR(50) NOT NULL
);

CREATE TABLE products (
    product_id VARCHAR(20) PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    list_price DECIMAL(12,2) NOT NULL
);

CREATE TABLE leads (
    lead_id VARCHAR(20) PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    sales_rep_id VARCHAR(20) NOT NULL,
    lead_source VARCHAR(30) NOT NULL,
    lead_created_date DATE NOT NULL,
    lead_score DECIMAL(6,2) NOT NULL,
    lead_status VARCHAR(30) NOT NULL,

    CONSTRAINT fk_leads_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_leads_sales_rep
        FOREIGN KEY (sales_rep_id)
        REFERENCES sales_reps(sales_rep_id)
);

CREATE TABLE opportunities (
    opportunity_id VARCHAR(20) PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    sales_rep_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    created_date DATE NOT NULL,
    deal_size DECIMAL(12,2) NOT NULL,
    stage VARCHAR(30) NOT NULL,
    close_date DATE NOT NULL,

    CONSTRAINT fk_opportunities_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_opportunities_sales_rep
        FOREIGN KEY (sales_rep_id)
        REFERENCES sales_reps(sales_rep_id),

    CONSTRAINT fk_opportunities_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);

CREATE TABLE sales_transactions (
    transaction_id VARCHAR(20) PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    sales_rep_id VARCHAR(20) NOT NULL,
    product_id VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    quantity INT NOT NULL,
    discount_pct DECIMAL(6,3) NOT NULL,
    net_revenue DECIMAL(12,2) NOT NULL,

    CONSTRAINT fk_transactions_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(customer_id),

    CONSTRAINT fk_transactions_sales_rep
        FOREIGN KEY (sales_rep_id)
        REFERENCES sales_reps(sales_rep_id),

    CONSTRAINT fk_transactions_product
        FOREIGN KEY (product_id)
        REFERENCES products(product_id)
);
