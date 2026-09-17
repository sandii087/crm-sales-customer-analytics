import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

DATA_PATH = "data/processed/weekly_profit_forecast_dataset.csv"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "gradient_boosting_gross_profit.joblib"
)

TARGET = "gross_profit"

FEATURES = [
    "year",
    "month",
    "quarter",
    "week_of_year",
    "profit_lag_1",
    "profit_lag_2",
    "profit_lag_4",
    "profit_rolling_4w",
    "profit_rolling_8w",
    "revenue_lag_1",
    "revenue_lag_2",
    "revenue_lag_4",
    "revenue_rolling_4w",
    "revenue_rolling_8w",
]


def smape(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)

    denominator = (np.abs(actual) + np.abs(predicted)) / 2
    mask = denominator != 0

    if not np.any(mask):
        return 0.0

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

    if np.any(non_zero):
        mape = (
            np.mean(
                np.abs(
                    (actual[non_zero] - predicted[non_zero])
                    / actual[non_zero]
                )
            )
            * 100
        )
    else:
        mape = 0.0

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

    train_raw = df.iloc[:-test_size].copy()
    test = df.iloc[-test_size:].copy()

    train = train_raw.dropna(
        subset=FEATURES + [TARGET]
    ).copy()

    X_train = train[FEATURES]
    y_train = train[TARGET]

    X_test = test[FEATURES]
    y_test = test[TARGET]

    # ------------------------------------------------------------
    # Persistence baseline
    # ------------------------------------------------------------

    baseline_predictions = []

    previous_profit = train_raw[TARGET].iloc[-1]

    for actual in y_test:
        baseline_predictions.append(previous_profit)
        previous_profit = actual

    baseline_predictions = np.asarray(
        baseline_predictions,
        dtype=float
    )

    baseline_metrics = calculate_metrics(
        y_test,
        baseline_predictions
    )

    # ------------------------------------------------------------
    # Gradient Boosting
    # ------------------------------------------------------------

    model = GradientBoostingRegressor(
        n_estimators=80,
        learning_rate=0.05,
        max_depth=2,
        min_samples_leaf=3,
        loss="huber",
        random_state=42,
    )

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(X_test)

    predictions = np.maximum(
        predictions,
        0
    )

    model_metrics = calculate_metrics(
        y_test,
        predictions
    )

    os.makedirs(
        MODEL_DIR,
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    results = pd.DataFrame({
        "week": test["week"],
        "actual_gross_profit": y_test,
        "baseline_prediction": baseline_predictions,
        "gradient_boosting_prediction": predictions,
    })

    print("=" * 72)
    print("GROSS PROFIT FORECAST MODEL COMPARISON")
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
        f"₹{baseline_metrics['MAE']:,.2f}"
    )

    print(
        f"RMSE                     : "
        f"₹{baseline_metrics['RMSE']:,.2f}"
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
        f"₹{model_metrics['MAE']:,.2f}"
    )

    print(
        f"RMSE                     : "
        f"₹{model_metrics['RMSE']:,.2f}"
    )

    print(
        f"MAPE                     : "
        f"{model_metrics['MAPE']:.2f}%"
    )

    print(
        f"sMAPE                    : "
        f"{model_metrics['sMAPE']:.2f}%"
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
