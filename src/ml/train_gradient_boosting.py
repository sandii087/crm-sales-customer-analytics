import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

DATA_PATH = "data/processed/weekly_forecast_dataset.csv"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(MODEL_DIR, "gradient_boosting_revenue.joblib")


FEATURES = [
    "year",
    "month",
    "quarter",
    "week_of_year",
    "revenue_lag_1",
    "revenue_lag_2",
    "revenue_lag_4",
    "quantity_lag_1",
    "transactions_lag_1",
    "active_customers_lag_1",
    "active_products_lag_1",
    "active_sales_reps_lag_1",
    "avg_discount_pct_lag_1",
    "revenue_rolling_4w",
    "revenue_rolling_8w",
    "revenue_growth_1w",
    "revenue_growth_4w",
]

TARGET = "net_revenue"


def smape(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)

    denominator = (np.abs(actual) + np.abs(predicted)) / 2

    mask = denominator != 0

    return (
        np.mean(
            np.abs(actual[mask] - predicted[mask])
            / denominator[mask]
        )
        * 100
    )


def main():
    df = pd.read_csv(DATA_PATH, parse_dates=["week"])

    # Only use rows where all forecasting features exist.
    model_df = df.dropna(
        subset=FEATURES + [TARGET]
    ).copy()

    # Chronological split — never shuffle time-series data.
    test_size = 10

    train = model_df.iloc[:-test_size].copy()
    test = model_df.iloc[-test_size:].copy()

    X_train = train[FEATURES]
    y_train = train[TARGET]

    X_test = test[FEATURES]
    y_test = test[TARGET]

    model = GradientBoostingRegressor(
        n_estimators=80,
        learning_rate=0.05,
        max_depth=2,
        min_samples_leaf=3,
        loss="huber",
        random_state=42,
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    mae = mean_absolute_error(y_test, predictions)

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    # MAPE is evaluated only where actual revenue > 0.
    non_zero_mask = y_test > 0

    mape = (
        np.mean(
            np.abs(
                (
                    y_test[non_zero_mask]
                    - predictions[non_zero_mask]
                )
                / y_test[non_zero_mask]
            )
        )
        * 100
    )

    model_smape = smape(
        y_test[non_zero_mask],
        predictions[non_zero_mask],
    )

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    results = pd.DataFrame(
        {
            "week": test["week"].values,
            "actual": y_test.values,
            "prediction": predictions,
        }
    )

    print("=" * 72)
    print("GRADIENT BOOSTING FORECAST EVALUATION")
    print("=" * 72)

    print(f"Training rows           : {len(train)}")
    print(f"Test rows               : {len(test)}")
    print(f"Features used           : {len(FEATURES)}")

    print("-" * 72)

    print(f"MAE                     : {mae:,.2f}")
    print(f"RMSE                    : {rmse:,.2f}")
    print(f"MAPE                    : {mape:.2f}%")
    print(f"sMAPE                   : {model_smape:.2f}%")

    print("-" * 72)

    print(f"Model saved             : {MODEL_PATH}")

    print("-" * 72)

    print("TEST PREDICTIONS")
    print(
        results.to_string(index=False)
    )

    print("=" * 72)


if __name__ == "__main__":
    main()
