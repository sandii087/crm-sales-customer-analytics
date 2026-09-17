import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

DATA_PATH = "data/processed/weekly_forecast_dataset.csv"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "gradient_boosting_revenue.joblib"
)

TARGET = "net_revenue"

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
]


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


def calculate_metrics(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)

    mae = mean_absolute_error(actual, predicted)

    rmse = np.sqrt(
        mean_squared_error(actual, predicted)
    )

    non_zero = actual > 0

    mape = (
        np.mean(
            np.abs(
                (actual[non_zero] - predicted[non_zero])
                / actual[non_zero]
            )
        )
        * 100
    )

    return {
        "MAE": mae,
        "RMSE": rmse,
        "MAPE": mape,
        "sMAPE": smape(actual, predicted),
    }


def main():
    df = pd.read_csv(
        DATA_PATH,
        parse_dates=["week"]
    ).sort_values("week").reset_index(drop=True)

    test_size = 10

    # IMPORTANT:
    # Test period is defined from the original complete dataset,
    # so both models evaluate exactly the same weeks.
    train_raw = df.iloc[:-test_size].copy()
    test = df.iloc[-test_size:].copy()

    # Only the training portion is filtered for feature availability.
    train = train_raw.dropna(
        subset=FEATURES + [TARGET]
    ).copy()

    X_train = train[FEATURES]
    y_train = train[TARGET]

    X_test = test[FEATURES]
    y_test = test[TARGET]

    # ------------------------------------------------------------
    # 1. Persistence baseline
    # ------------------------------------------------------------

    baseline_predictions = []

    previous_revenue = train_raw[TARGET].iloc[-1]

    for actual in y_test:
        baseline_predictions.append(previous_revenue)
        previous_revenue = actual

    baseline_predictions = np.array(
        baseline_predictions,
        dtype=float
    )

    baseline_metrics = calculate_metrics(
        y_test,
        baseline_predictions
    )

    # ------------------------------------------------------------
    # 2. Gradient Boosting
    # ------------------------------------------------------------

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

    gb_metrics = calculate_metrics(
        y_test,
        predictions
    )

    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(
        model,
        MODEL_PATH
    )

    # ------------------------------------------------------------
    # Results
    # ------------------------------------------------------------

    results = pd.DataFrame({
        "week": test["week"],
        "actual": y_test,
        "baseline_prediction": baseline_predictions,
        "gradient_boosting_prediction": predictions,
    })

    print("=" * 72)
    print("FAIR FORECAST MODEL COMPARISON")
    print("=" * 72)

    print(
        f"Training weeks available : {len(train)}"
    )

    print(
        f"Test weeks               : {len(test)}"
    )

    print(
        f"Test period              : "
        f"{test['week'].iloc[0].date()} "
        f"to "
        f"{test['week'].iloc[-1].date()}"
    )

    print("-" * 72)

    print("BASELINE — PERSISTENCE")

    print(
        f"MAE                      : "
        f"{baseline_metrics['MAE']:,.2f}"
    )

    print(
        f"RMSE                     : "
        f"{baseline_metrics['RMSE']:,.2f}"
    )

    print(
        f"MAPE                     : "
        f"{baseline_metrics['MAPE']:.2f}%"
    )

    print(
        f"sMAPE                    : "
        f"{baseline_metrics['sMAPE']:.2f}%"
    )

    print("-" * 72)

    print("GRADIENT BOOSTING")

    print(
        f"MAE                      : "
        f"{gb_metrics['MAE']:,.2f}"
    )

    print(
        f"RMSE                     : "
        f"{gb_metrics['RMSE']:,.2f}"
    )

    print(
        f"MAPE                     : "
        f"{gb_metrics['MAPE']:.2f}%"
    )

    print(
        f"sMAPE                    : "
        f"{gb_metrics['sMAPE']:.2f}%"
    )

    print("-" * 72)

    print("TEST PREDICTIONS")

    print(
        results.to_string(index=False)
    )

    print("-" * 72)

    print(
        f"Model saved              : {MODEL_PATH}"
    )

    print("=" * 72)


if __name__ == "__main__":
    main()
