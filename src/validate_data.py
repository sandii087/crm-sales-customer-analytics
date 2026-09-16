from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "processed"

errors = []


def check(condition: bool, message: str):
    if condition:
        print(f"PASS: {message}")
    else:
        print(f"FAIL: {message}")
        errors.append(message)


customers = pd.read_csv(DATA / "customers_clean.csv")
leads = pd.read_csv(DATA / "leads_clean.csv")
sales_reps = pd.read_csv(DATA / "sales_reps_clean.csv")
products = pd.read_csv(DATA / "products_clean.csv")
opportunities = pd.read_csv(DATA / "opportunities_clean.csv")
transactions = pd.read_csv(DATA / "sales_transactions_clean.csv")


print("=== CUSTOMER VALIDATION ===")

check(
    len(customers) == 1200,
    "customer row count is 1,200",
)

check(
    customers["customer_id"].is_unique,
    "customer IDs are unique",
)

check(
    customers["industry"].notna().all(),
    "customer industry has no missing values",
)

check(
    customers["region"].isin(
        ["North", "South", "East", "West"]
    ).all(),
    "customer regions use valid standardized values",
)


print("\n=== LEAD VALIDATION ===")

check(
    len(leads) == 3000,
    "lead row count is 3,000 after deduplication",
)

check(
    leads["lead_id"].is_unique,
    "lead IDs are unique",
)

check(
    leads["lead_score"].notna().all(),
    "lead score has no missing values",
)

check(
    leads["lead_score"].between(0, 100).all(),
    "lead scores are between 0 and 100",
)


print("\n=== REFERENCE TABLE VALIDATION ===")

check(
    sales_reps["sales_rep_id"].is_unique,
    "sales representative IDs are unique",
)

check(
    products["product_id"].is_unique,
    "product IDs are unique",
)


print("\n=== OPPORTUNITY VALIDATION ===")

check(
    opportunities["opportunity_id"].is_unique,
    "opportunity IDs are unique",
)

check(
    opportunities["deal_size"].gt(0).all(),
    "opportunity deal sizes are positive",
)

valid_stages = {
    "Prospecting",
    "Qualified",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
}

check(
    opportunities["stage"].isin(valid_stages).all(),
    "opportunity stages use valid values",
)


print("\n=== TRANSACTION VALIDATION ===")

check(
    transactions["transaction_id"].is_unique,
    "transaction IDs are unique",
)

check(
    transactions["net_revenue"].gt(0).all(),
    "transaction net revenue is positive",
)

check(
    transactions["discount_pct"].between(0, 0.20).all(),
    "discount percentages are within expected range",
)


print("\n=== RESULT ===")

if errors:
    print(f"VALIDATION FAILED: {len(errors)} issue(s)")
    raise SystemExit(1)

print("ALL DATA QUALITY CHECKS PASSED")
