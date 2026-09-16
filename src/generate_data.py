from pathlib import Path

import numpy as np
import pandas as pd


# ============================================================
# Configuration
# ============================================================

RANDOM_SEED = 42
rng = np.random.default_rng(RANDOM_SEED)

ROOT = Path(__file__).resolve().parents[1]
RAW_DIR = ROOT / "data" / "raw"
RAW_DIR.mkdir(parents=True, exist_ok=True)

START_DATE = pd.Timestamp("2025-10-01")
END_DATE = pd.Timestamp("2026-09-30")


# ============================================================
# Customers
# ============================================================

n_customers = 1200

regions = ["North", "South", "East", "West"]

segments = ["SMB", "Mid-Market", "Enterprise"]

industries = [
    "Technology",
    "Healthcare",
    "Finance",
    "Retail",
    "Manufacturing",
]

acquisition_channels = [
    "Website",
    "Referral",
    "Partner",
    "Email",
    "Event",
]

customers = pd.DataFrame({
    "customer_id": [
        f"CUST{10001 + i}" for i in range(n_customers)
    ],

    "region": rng.choice(
        regions,
        n_customers,
        p=[0.27, 0.26, 0.22, 0.25],
    ),

    "segment": rng.choice(
        segments,
        n_customers,
        p=[0.50, 0.32, 0.18],
    ),

    "industry": rng.choice(
        industries,
        n_customers,
    ),

    "acquisition_channel": rng.choice(
        acquisition_channels,
        n_customers,
    ),
})

customers["signup_date"] = pd.to_datetime(
    rng.choice(
        pd.date_range(
            START_DATE,
            END_DATE,
            freq="D",
        ),
        n_customers,
    )
)


# ============================================================
# Sales Representatives
# ============================================================

n_reps = 30

sales_reps = pd.DataFrame({
    "sales_rep_id": [
        f"REP{1001 + i}" for i in range(n_reps)
    ],

    "sales_rep_name": [
        f"Sales Rep {i + 1}" for i in range(n_reps)
    ],

    "region": rng.choice(
        regions,
        n_reps,
    ),

    "team": rng.choice(
        [
            "Inside Sales",
            "Enterprise Sales",
            "Commercial Sales",
        ],
        n_reps,
    ),
})


# ============================================================
# Products
# ============================================================

products = pd.DataFrame({
    "product_id": [
        f"P{1001 + i}" for i in range(12)
    ],

    "product_name": [
        "Analytics Platform",
        "CRM Suite",
        "Data Integration",
        "Cloud Migration",
        "Security Suite",
        "Customer Insights",
        "Workflow Automation",
        "BI Dashboard",
        "Marketing Automation",
        "Data Quality",
        "AI Assistant",
        "API Management",
    ],

    "category": [
        "Analytics",
        "CRM",
        "Data",
        "Cloud",
        "Security",
        "Analytics",
        "Automation",
        "Analytics",
        "Marketing",
        "Data",
        "AI",
        "Platform",
    ],

    "list_price": [
        8500,
        6200,
        7800,
        15000,
        11000,
        5200,
        6800,
        4500,
        3900,
        5600,
        12500,
        7200,
    ],
})


# ============================================================
# Leads
# ============================================================

n_leads = 3000

leads = pd.DataFrame({
    "lead_id": [
        f"LEAD{100001 + i}" for i in range(n_leads)
    ],

    "customer_id": rng.choice(
        customers["customer_id"],
        n_leads,
    ),

    "sales_rep_id": rng.choice(
        sales_reps["sales_rep_id"],
        n_leads,
    ),

    "lead_source": rng.choice(
        acquisition_channels,
        n_leads,
    ),

    "lead_created_date": pd.to_datetime(
        rng.choice(
            pd.date_range(
                START_DATE,
                END_DATE,
                freq="D",
            ),
            n_leads,
        )
    ),

    "lead_score": rng.integers(
        20,
        101,
        n_leads,
    ),
})

leads["lead_status"] = np.select(
    [
        leads["lead_score"] >= 80,
        leads["lead_score"] >= 60,
        leads["lead_score"] >= 40,
    ],
    [
        "Qualified",
        "Nurturing",
        "New",
    ],
    default="Low Priority",
)


# ============================================================
# Opportunities
# ============================================================

n_opportunities = 1800

opportunities = pd.DataFrame({
    "opportunity_id": [
        f"OPP{200001 + i}"
        for i in range(n_opportunities)
    ],

    "customer_id": rng.choice(
        customers["customer_id"],
        n_opportunities,
    ),

    "sales_rep_id": rng.choice(
        sales_reps["sales_rep_id"],
        n_opportunities,
    ),

    "product_id": rng.choice(
        products["product_id"],
        n_opportunities,
    ),

    "created_date": pd.to_datetime(
        rng.choice(
            pd.date_range(
                START_DATE,
                END_DATE - pd.Timedelta(days=90),
                freq="D",
            ),
            n_opportunities,
        )
    ),
})


# ============================================================
# Opportunity business logic
# ============================================================

customer_segment_map = customers.set_index(
    "customer_id"
)["segment"]

product_price_map = products.set_index(
    "product_id"
)["list_price"]

opportunities["segment"] = opportunities[
    "customer_id"
].map(customer_segment_map)

opportunities["base_price"] = opportunities[
    "product_id"
].map(product_price_map)


segment_multipliers = {
    "SMB": 0.85,
    "Mid-Market": 1.20,
    "Enterprise": 1.75,
}

opportunities["segment_multiplier"] = opportunities[
    "segment"
].map(segment_multipliers)


quantity_ranges = {
    "SMB": (1, 4),
    "Mid-Market": (2, 7),
    "Enterprise": (4, 12),
}

opportunities["quantity"] = [
    rng.integers(
        quantity_ranges[segment][0],
        quantity_ranges[segment][1] + 1,
    )
    for segment in opportunities["segment"]
]


price_variation = rng.uniform(
    0.90,
    1.10,
    n_opportunities,
)

opportunities["deal_size"] = np.round(
    opportunities["base_price"]
    * opportunities["quantity"]
    * opportunities["segment_multiplier"]
    * price_variation,
    2,
)


# ============================================================
# Opportunity stages
# ============================================================

opportunities["stage"] = rng.choice(
    [
        "Prospecting",
        "Qualified",
        "Proposal",
        "Negotiation",
        "Won",
        "Lost",
    ],
    n_opportunities,
    p=[
        0.20,
        0.18,
        0.20,
        0.14,
        0.18,
        0.10,
    ],
)


# ============================================================
# Realistic sales-cycle length
# ============================================================

cycle_days = []

for segment in opportunities["segment"]:

    if segment == "SMB":
        days = rng.integers(7, 46)

    elif segment == "Mid-Market":
        days = rng.integers(14, 61)

    else:
        days = rng.integers(30, 91)

    cycle_days.append(days)


opportunities["close_date"] = (
    opportunities["created_date"]
    + pd.to_timedelta(
        cycle_days,
        unit="D",
    )
)

opportunities["close_date"] = opportunities[
    "close_date"
].clip(
    lower=START_DATE,
    upper=END_DATE,
)


# Remove temporary opportunity columns

opportunities = opportunities[
    [
        "opportunity_id",
        "customer_id",
        "sales_rep_id",
        "product_id",
        "created_date",
        "deal_size",
        "stage",
        "close_date",
    ]
]


# ============================================================
# Sales Transactions
# ============================================================

won_opportunities = opportunities[
    opportunities["stage"] == "Won"
].copy()


transactions = won_opportunities[
    [
        "opportunity_id",
        "customer_id",
        "sales_rep_id",
        "product_id",
        "close_date",
    ]
].rename(
    columns={
        "close_date": "transaction_date",
    }
)


transactions["transaction_id"] = [
    f"TXN{300001 + i}"
    for i in range(len(transactions))
]


# ============================================================
# Transaction business logic
# ============================================================

transactions["segment"] = transactions[
    "customer_id"
].map(customer_segment_map)

transactions["product_price"] = transactions[
    "product_id"
].map(product_price_map)

transactions["segment_multiplier"] = transactions[
    "segment"
].map(segment_multipliers)


transactions["quantity"] = [
    rng.integers(
        quantity_ranges[segment][0],
        quantity_ranges[segment][1] + 1,
    )
    for segment in transactions["segment"]
]


transaction_variation = rng.uniform(
    0.90,
    1.10,
    len(transactions),
)


transactions["revenue"] = np.round(
    transactions["product_price"]
    * transactions["quantity"]
    * transactions["segment_multiplier"]
    * transaction_variation,
    2,
)


# ============================================================
# Segment-specific discounts
# ============================================================

discount_ranges = {
    "SMB": (0.00, 0.08),
    "Mid-Market": (0.02, 0.12),
    "Enterprise": (0.05, 0.18),
}

transactions["discount_pct"] = [
    round(
        rng.uniform(
            discount_ranges[segment][0],
            discount_ranges[segment][1],
        ),
        3,
    )
    for segment in transactions["segment"]
]


transactions["net_revenue"] = np.round(
    transactions["revenue"]
    * (1 - transactions["discount_pct"]),
    2,
)


# ============================================================
# Final transaction columns
# ============================================================

transactions = transactions[
    [
        "transaction_id",
        "customer_id",
        "sales_rep_id",
        "product_id",
        "transaction_date",
        "revenue",
        "quantity",
        "discount_pct",
        "net_revenue",
    ]
]


# ============================================================
# Save datasets
# ============================================================

datasets = {
    "customers.csv": customers,
    "sales_reps.csv": sales_reps,
    "products.csv": products,
    "leads.csv": leads,
    "opportunities.csv": opportunities,
    "sales_transactions.csv": transactions,
}


for filename, dataframe in datasets.items():

    dataframe.to_csv(
        RAW_DIR / filename,
        index=False,
    )

    print(
        f"Created {filename}: "
        f"{len(dataframe):,} rows"
    )


print(
    f"\nRaw data written to: {RAW_DIR}"
)

print(
    f"Analytical period: "
    f"{START_DATE.date()} → {END_DATE.date()}"
)

