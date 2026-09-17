import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor

DATA_PATH = "data/processed/weekly_forecast_dataset.csv"
MODEL_DIR = "models"
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "deployable_revenue_forecaster.joblib"
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
    "revenue_rolling_4w",
    "revenue_rolling_8w",
]


def build_features(history, forecast_week):
    values = history["net_revenue"].tolist()

    lag_1 = values[-1]
    lag_2 = values[-2]
    lag_4 = values[-4:]

    rolling_4 = np.mean(values[-4:])
    rolling_8 = np.mean(values[-8:])

    return pd.DataFrame([{
        "year": forecast_week.year,
        "month": forecast_week.month,
        "quarter": forecast_week.quarter,
        "week_of_year": int(forecast_week.isocalendar().week),
        "revenue_lag_1": lag_1,
        "revenue_lag_2": lag_2,
        "revenue_lag_4": lag_4[0],
        "revenue_rolling_4w": rolling_4,
        "revenue_rolling_8w": rolling_8,
    }])


def main():
    df = pd.read_csv(
        DATA_PATH,
        parse_dates=["week"]
    ).sort_values("week").reset_index(drop=True)

    training = df.dropna(
        subset=FEATURES + [TARGET]
    ).copy()

    model = GradientBoostingRegressor(
        n_estimators=100,
        learning_rate=0.05,
        max_depth=2,
        min_samples_leaf=3,
        loss="huber",
        random_state=42,
    )

    model.fit(
        training[FEATURES],
        training[TARGET]
    )

    # Preserve the latest observed history for recursive forecasting.
    history = df[["week", TARGET]].copy()

    last_week = history["week"].iloc[-1]

    # Forecast the next 8 weekly periods.
    future_weeks = pd.date_range(
        start=last_week + pd.Timedelta(days=7),
        periods=8,
        freq="7D",
    )

    forecasts = []

    for week in future_weeks:
        X_future = build_features(
            history,
            week
        )

        prediction = float(
            model.predict(X_future[FEATURES])[0]
        )

        # Revenue cannot legitimately be negative.
        prediction = max(0.0, prediction)

        forecasts.append({
            "week": week,
            "forecast_net_revenue": prediction,
        })

        # Add prediction back into history so the next
        # forecast can use it as a lag.
        history = pd.concat(
            [
                history,
                pd.DataFrame(
                    [{
                        "week": week,
                        TARGET: prediction
                    }]
                )
            ],
            ignore_index=True,
        )

    forecast_df = pd.DataFrame(forecasts)

    os.makedirs(MODEL_DIR, exist_ok=True)

    joblib.dump(
        model,
        MODEL_PATH
    )

    output_path = (
        "data/processed/revenue_forecast_8_weeks.csv"
    )

    forecast_df.to_csv(
        output_path,
        index=False
    )

    print("=" * 72)
    print("DEPLOYABLE REVENUE FORECAST")
    print("=" * 72)

    print(
        f"Training observations : {len(training)}"
    )

    print(
        f"Last historical week  : {last_week.date()}"
    )

    print(
        f"Forecast horizon       : 8 weeks"
    )

    print(
        f"Model                  : Gradient Boosting"
    )

    print("-" * 72)

    print(
        forecast_df.to_string(index=False)
    )

    print("-" * 72)

    print(
        f"Model saved            : {MODEL_PATH}"
    )

    print(
        f"Forecast saved         : {output_path}"
    )

    print("=" * 72)


if __name__ == "__main__":
    main()
