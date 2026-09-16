from pathlib import Path
import pandas as pd
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"

rng = np.random.default_rng(42)

# 1. Missing lead scores
leads_path = RAW / "leads.csv"
leads = pd.read_csv(leads_path)

missing_idx = rng.choice(leads.index, size=15, replace=False)
leads.loc[missing_idx, "lead_score"] = np.nan

# 2. Duplicate leads
duplicates = leads.sample(8, random_state=42)
leads = pd.concat([leads, duplicates], ignore_index=True)

leads.to_csv(leads_path, index=False)

# 3. Inconsistent region labels
customers_path = RAW / "customers.csv"
customers = pd.read_csv(customers_path)

region_idx = rng.choice(customers.index, size=10, replace=False)
customers.loc[region_idx[:5], "region"] = "north"
customers.loc[region_idx[5:], "region"] = " SOUTH "

# 4. Missing industry values
industry_idx = rng.choice(customers.index, size=10, replace=False)
customers.loc[industry_idx, "industry"] = np.nan

customers.to_csv(customers_path, index=False)

print("Data-quality issues injected successfully.")
print(f"Leads rows after duplicates: {len(leads):,}")
print("Missing lead scores introduced: 15")
print("Duplicate lead records introduced: 8")
print("Inconsistent customer region values introduced: 10")
print("Missing customer industries introduced: 10")
