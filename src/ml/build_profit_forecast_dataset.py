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
            revenue,
            quantity,
            net_revenue,
            cogs,
            gross_profit
        FROM sales_transactions
        ORDER BY transaction_date
    """

    with engine.connect() as connection:
        df = pd.read_sql(query, connection)

    df["transaction_date"] = pd.to_datetime(
        df["transaction_date"]
    )

    return df


def build_weekly_dataset(df):
    df = df.copy()

    df["week"] = (
        df["transaction_date"]
        .dt.to_period("W-MON")
        .apply(lambda period: period.start_time)
    )

    weekly = (
        df.groupby("week")
        .agg(
            revenue=("revenue", "sum"),
            net_revenue=("net_revenue", "sum"),
            cogs=("cogs", "sum"),
            gross_profit=("gross_profit", "sum"),
            quantity=("quantity", "sum"),
            transactions=("transaction_id", "count"),
        )
        .reset_index()
    )

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

    for column in [
        "revenue",
        "net_revenue",
        "cogs",
        "gross_profit",
        "quantity",
        "transactions",
    ]:
        weekly[column] = weekly[column].fillna(0)

    weekly["gross_margin_pct"] = (
        weekly["gross_profit"]
        .div(weekly["net_revenue"].replace(0, float("nan")))
        .mul(100)
    )

    # Keep margin as numeric float values.
    # Zero-revenue weeks remain NaN because margin is undefined there.
    weekly["gross_margin_pct"] = pd.to_numeric(
        weekly["gross_margin_pct"],
        errors="coerce",
    )

    # Forecast-safe gross-margin features.
    weekly["margin_lag_1"] = (
        weekly["gross_margin_pct"].shift(1)
    )

    weekly["margin_lag_2"] = (
        weekly["gross_margin_pct"].shift(2)
    )

    weekly["margin_lag_4"] = (
        weekly["gross_margin_pct"].shift(4)
    )

    weekly["margin_rolling_4w"] = (
        weekly["gross_margin_pct"]
        .shift(1)
        .rolling(4, min_periods=1)
        .mean()
    )

    weekly["margin_rolling_8w"] = (
        weekly["gross_margin_pct"]
        .shift(1)
        .rolling(8, min_periods=1)
        .mean()
    )

    # Forecast-safe historical features.
    weekly["profit_lag_1"] = weekly["gross_profit"].shift(1)
    weekly["profit_lag_2"] = weekly["gross_profit"].shift(2)
    weekly["profit_lag_4"] = weekly["gross_profit"].shift(4)

    weekly["profit_rolling_4w"] = (
        weekly["gross_profit"]
        .shift(1)
        .rolling(4, min_periods=1)
        .mean()
    )

    weekly["profit_rolling_8w"] = (
        weekly["gross_profit"]
        .shift(1)
        .rolling(8, min_periods=1)
        .mean()
    )

    weekly["revenue_lag_1"] = weekly["net_revenue"].shift(1)
    weekly["revenue_lag_2"] = weekly["net_revenue"].shift(2)
    weekly["revenue_lag_4"] = weekly["net_revenue"].shift(4)

    weekly["revenue_rolling_4w"] = (
        weekly["net_revenue"]
        .shift(1)
        .rolling(4, min_periods=1)
        .mean()
    )

    weekly["revenue_rolling_8w"] = (
        weekly["net_revenue"]
        .shift(1)
        .rolling(8, min_periods=1)
        .mean()
    )

    weekly["year"] = weekly["week"].dt.year
    weekly["month"] = weekly["week"].dt.month
    weekly["quarter"] = weekly["week"].dt.quarter
    weekly["week_of_year"] = (
        weekly["week"]
        .dt.isocalendar()
        .week
        .astype(int)
    )

    weekly["profit_growth_1w"] = (
        weekly["gross_profit"]
        .shift(1)
        .pct_change()
    )

    weekly["profit_growth_4w"] = (
        weekly["gross_profit"]
        .shift(1)
        .pct_change(4)
    )

    weekly = weekly.replace(
        [float("inf"), float("-inf")],
        pd.NA,
    )

    output_path = (
        "data/processed/weekly_profit_forecast_dataset.csv"
    )

    os.makedirs(
        "data/processed",
        exist_ok=True,
    )

    weekly.to_csv(
        output_path,
        index=False,
    )

    print("=" * 72)
    print("WEEKLY PROFITABILITY DATASET CREATED")
    print("=" * 72)

    print(f"Rows                    : {len(weekly)}")
    print(
        f"First week              : "
        f"{weekly['week'].min().date()}"
    )
    print(
        f"Last week               : "
        f"{weekly['week'].max().date()}"
    )

    print(
        f"Total gross profit      : "
        f"₹{weekly['gross_profit'].sum():,.2f}"
    )

    print(
        f"Output                  : {output_path}"
    )

    print("-" * 72)

    print("Columns:")
    print(", ".join(weekly.columns))

    print("=" * 72)


def main():
    transactions = load_transactions()
    build_weekly_dataset(transactions)


if __name__ == "__main__":
    main()
