import os
import pandas as pd
from sqlalchemy import create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@127.0.0.1:3306/crm_sales_analytics"
)


def load_transactions():
    engine = create_engine(DATABASE_URL)

    query = """
        SELECT
            transaction_id,
            transaction_date,
            customer_id,
            product_id,
            sales_rep_id,
            revenue,
            quantity,
            discount_pct,
            net_revenue
        FROM sales_transactions
        ORDER BY transaction_date
    """

    with engine.connect() as connection:
        df = pd.read_sql(query, connection)

    df["transaction_date"] = pd.to_datetime(df["transaction_date"])

    return df


def build_weekly_dataset(df):
    df = df.copy()

    # Monday-based weekly aggregation
    df["week"] = df["transaction_date"].dt.to_period("W-MON").apply(
        lambda period: period.start_time
    )

    weekly = (
        df.groupby("week")
        .agg(
            revenue=("revenue", "sum"),
            net_revenue=("net_revenue", "sum"),
            quantity=("quantity", "sum"),
            transactions=("transaction_id", "count"),
            active_customers=("customer_id", "nunique"),
            active_products=("product_id", "nunique"),
            active_sales_reps=("sales_rep_id", "nunique"),
            avg_discount_pct=("discount_pct", "mean"),
        )
        .reset_index()
    )

    # Create a continuous weekly calendar so missing weeks are represented.
    full_weeks = pd.date_range(
        start=weekly["week"].min(),
        end=weekly["week"].max(),
        freq="7D",
    )

    weekly = (
        weekly.set_index("week")
        .reindex(full_weeks)
        .rename_axis("week")
        .reset_index()
    )

    numeric_zero_columns = [
        "revenue",
        "net_revenue",
        "quantity",
        "transactions",
        "active_customers",
        "active_products",
        "active_sales_reps",
    ]

    for column in numeric_zero_columns:
        weekly[column] = weekly[column].fillna(0)

    weekly["avg_discount_pct"] = weekly["avg_discount_pct"].fillna(0)

    # Calendar features
    weekly["year"] = weekly["week"].dt.year
    weekly["month"] = weekly["week"].dt.month
    weekly["quarter"] = weekly["week"].dt.quarter
    weekly["week_of_year"] = weekly["week"].dt.isocalendar().week.astype(int)

    # Lag features
    weekly["revenue_lag_1"] = weekly["net_revenue"].shift(1)
    weekly["revenue_lag_2"] = weekly["net_revenue"].shift(2)
    weekly["revenue_lag_4"] = weekly["net_revenue"].shift(4)

    weekly["quantity_lag_1"] = weekly["quantity"].shift(1)
    weekly["transactions_lag_1"] = weekly["transactions"].shift(1)

    # Lagged operational features.
    # These represent information that would actually be available
    # before forecasting the next week.
    weekly["active_customers_lag_1"] = weekly["active_customers"].shift(1)
    weekly["active_products_lag_1"] = weekly["active_products"].shift(1)
    weekly["active_sales_reps_lag_1"] = weekly["active_sales_reps"].shift(1)
    weekly["avg_discount_pct_lag_1"] = weekly["avg_discount_pct"].shift(1)

    # Rolling features
    # Forecast-safe rolling features:
    # shift(1) ensures the current week's revenue is never used
    # to predict that same week's revenue.
    weekly["revenue_rolling_4w"] = (
        weekly["net_revenue"].shift(1).rolling(4, min_periods=1).mean()
    )

    weekly["revenue_rolling_8w"] = (
        weekly["net_revenue"].shift(1).rolling(8, min_periods=1).mean()
    )

    # Forecast-safe growth features.
    weekly["revenue_growth_1w"] = weekly["net_revenue"].shift(1).pct_change()
    weekly["revenue_growth_4w"] = weekly["net_revenue"].shift(1).pct_change(4)

    weekly = weekly.replace([float("inf"), float("-inf")], pd.NA)

    output_path = "data/processed/weekly_forecast_dataset.csv"

    os.makedirs("data/processed", exist_ok=True)

    weekly.to_csv(output_path, index=False)

    print("=" * 72)
    print("WEEKLY FORECAST DATASET CREATED")
    print("=" * 72)
    print(f"Rows                    : {len(weekly)}")
    print(f"First week              : {weekly['week'].min().date()}")
    print(f"Last week               : {weekly['week'].max().date()}")
    print(f"Output                  : {output_path}")
    print()
    print("Columns:")
    print(", ".join(weekly.columns))
    print("=" * 72)
    return weekly


def main():
    transactions = load_transactions()
    weekly = build_weekly_dataset(transactions)
    print(weekly.tail(10).to_string(index=False))


if __name__ == "__main__":
    main()
