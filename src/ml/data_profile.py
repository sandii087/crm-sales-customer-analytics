import os
from dataclasses import dataclass

import pandas as pd
from sqlalchemy import create_engine, text


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:@127.0.0.1:3306/crm_sales_analytics",
)


@dataclass
class ForecastDataProfile:
    transactions: int
    first_date: pd.Timestamp | None
    last_date: pd.Timestamp | None
    calendar_days: int
    active_months: int
    active_weeks: int
    customers_with_transactions: int
    products_with_transactions: int
    avg_transactions_per_month: float
    avg_transactions_per_week: float
    nonzero_month_ratio: float
    deep_learning_ready: bool
    reason: str


def load_transaction_data() -> pd.DataFrame:
    engine = create_engine(DATABASE_URL)

    query = text(
        """
        SELECT
            transaction_id,
            customer_id,
            sales_rep_id,
            product_id,
            transaction_date,
            revenue,
            quantity,
            discount_pct,
            net_revenue
        FROM sales_transactions
        ORDER BY transaction_date
        """
    )

    with engine.connect() as connection:
        df = pd.read_sql(query, connection)

    df["transaction_date"] = pd.to_datetime(df["transaction_date"])

    numeric_columns = [
        "revenue",
        "quantity",
        "discount_pct",
        "net_revenue",
    ]

    for column in numeric_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df = df.dropna(subset=["transaction_date", "net_revenue"])

    return df


def build_profile(df: pd.DataFrame) -> ForecastDataProfile:
    if df.empty:
        return ForecastDataProfile(
            transactions=0,
            first_date=None,
            last_date=None,
            calendar_days=0,
            active_months=0,
            active_weeks=0,
            customers_with_transactions=0,
            products_with_transactions=0,
            avg_transactions_per_month=0.0,
            avg_transactions_per_week=0.0,
            nonzero_month_ratio=0.0,
            deep_learning_ready=False,
            reason="No transaction data is available.",
        )

    first_date = df["transaction_date"].min()
    last_date = df["transaction_date"].max()

    calendar_days = int((last_date - first_date).days) + 1

    monthly = (
        df.set_index("transaction_date")
        .resample("MS")
        .size()
    )

    weekly = (
        df.set_index("transaction_date")
        .resample("W-MON")
        .size()
    )

    active_months = int((monthly > 0).sum())
    active_weeks = int((weekly > 0).sum())

    avg_transactions_per_month = (
        float(len(df) / active_months)
        if active_months
        else 0.0
    )

    avg_transactions_per_week = (
        float(len(df) / active_weeks)
        if active_weeks
        else 0.0
    )

    nonzero_month_ratio = (
        float((monthly > 0).mean())
        if len(monthly)
        else 0.0
    )

    customers_with_transactions = int(
        df["customer_id"].nunique()
    )

    products_with_transactions = int(
        df["product_id"].nunique()
    )

    reasons = []

    # Conservative portfolio-project gate.
    # This is intentionally stricter than "can technically train an LSTM".
    if active_months < 18:
        reasons.append(
            f"only {active_months} active months; at least 18 are preferred"
        )

    if active_weeks < 52:
        reasons.append(
            f"only {active_weeks} active weeks; at least 52 are preferred"
        )

    if len(df) < 1000:
        reasons.append(
            f"only {len(df)} transactions; at least 1000 are preferred"
        )

    if products_with_transactions < 8:
        reasons.append(
            "too few products with transaction history"
        )

    if reasons:
        deep_learning_ready = False
        reason = "; ".join(reasons)
    else:
        deep_learning_ready = True
        reason = (
            "Historical coverage and transaction volume meet "
            "the minimum readiness thresholds for a deep-learning "
            "candidate model."
        )

    return ForecastDataProfile(
        transactions=len(df),
        first_date=first_date,
        last_date=last_date,
        calendar_days=calendar_days,
        active_months=active_months,
        active_weeks=active_weeks,
        customers_with_transactions=customers_with_transactions,
        products_with_transactions=products_with_transactions,
        avg_transactions_per_month=avg_transactions_per_month,
        avg_transactions_per_week=avg_transactions_per_week,
        nonzero_month_ratio=nonzero_month_ratio,
        deep_learning_ready=deep_learning_ready,
        reason=reason,
    )


def print_profile(profile: ForecastDataProfile) -> None:
    print("\n" + "=" * 72)
    print("CRM SALES FORECASTING — DATA SUFFICIENCY PROFILE")
    print("=" * 72)

    print(f"Transactions                 : {profile.transactions:,}")
    print(f"First transaction date      : {profile.first_date.date() if profile.first_date is not None else 'N/A'}")
    print(f"Last transaction date       : {profile.last_date.date() if profile.last_date is not None else 'N/A'}")
    print(f"Calendar coverage (days)    : {profile.calendar_days:,}")
    print(f"Active months               : {profile.active_months}")
    print(f"Active weeks                : {profile.active_weeks}")
    print(f"Customers with transactions : {profile.customers_with_transactions:,}")
    print(f"Products with transactions  : {profile.products_with_transactions}")
    print(f"Avg transactions / month    : {profile.avg_transactions_per_month:.2f}")
    print(f"Avg transactions / week     : {profile.avg_transactions_per_week:.2f}")
    print(f"Non-zero month ratio        : {profile.nonzero_month_ratio:.2%}")

    print("-" * 72)

    if profile.deep_learning_ready:
        print("DEEP LEARNING READINESS      : READY")
    else:
        print("DEEP LEARNING READINESS      : NOT READY")

    print(f"Reason                       : {profile.reason}")

    print("=" * 72)


def main() -> None:
    df = load_transaction_data()
    profile = build_profile(df)
    print_profile(profile)


if __name__ == "__main__":
    main()
