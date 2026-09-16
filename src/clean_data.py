from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
PROCESSED = ROOT / "data" / "processed"

PROCESSED.mkdir(parents=True, exist_ok=True)


def clean_customers():
    path = RAW / "customers.csv"
    df = pd.read_csv(path)

    before = len(df)

    df["region"] = (
        df["region"]
        .astype(str)
        .str.strip()
        .str.title()
    )

    df["industry"] = df["industry"].fillna("Unknown")

    df.to_csv(PROCESSED / "customers_clean.csv", index=False)

    print(f"Customers: {before:,} -> {len(df):,} rows")
    print(f"Missing industry after cleaning: {df['industry'].isna().sum()}")


def clean_leads():
    path = RAW / "leads.csv"
    df = pd.read_csv(path)

    before = len(df)

    duplicate_count = df.duplicated().sum()

    df = df.drop_duplicates()

    df["lead_score"] = df["lead_score"].fillna(
        df["lead_score"].median()
    )

    df["lead_created_date"] = pd.to_datetime(
        df["lead_created_date"],
        errors="coerce"
    )

    df.to_csv(PROCESSED / "leads_clean.csv", index=False)

    print(f"Leads: {before:,} -> {len(df):,} rows")
    print(f"Duplicates removed: {duplicate_count:,}")
    print(f"Missing lead scores after cleaning: {df['lead_score'].isna().sum()}")


def copy_clean_table(filename: str):
    df = pd.read_csv(RAW / filename)

    output_name = filename.replace(".csv", "_clean.csv")

    df.to_csv(
        PROCESSED / output_name,
        index=False
    )

    print(f"{filename}: {len(df):,} rows copied")


if __name__ == "__main__":
    clean_customers()
    clean_leads()

    copy_clean_table("sales_reps.csv")
    copy_clean_table("products.csv")
    copy_clean_table("opportunities.csv")
    copy_clean_table("sales_transactions.csv")

    print("\nCleaned datasets written to:")
    print(PROCESSED)
