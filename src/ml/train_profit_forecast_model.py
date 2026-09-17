import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor

PROFIT_DATA_PATH = (
    "data/processed/weekly_profit_forecast_dataset.csv"
)

REVENUE_FORECAST_PATH = (
    "data/processed/revenue_forecast_8_weeks.csv"
)

MODEL_DIR = "models"

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "deployable_gross_profit_forecaster.joblib"
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


def build_features(
    profit_history,
    revenue_history,
    forecast_week,
):
    profit_values = profit_history.tolist()
    revenue_values = revenue_history.tolist()

    return pd.DataFrame([{
        "year": forecast_week.year,
        "month": forecast_week.month,
        "quarter": forecast_week.quarter,
        "week_of_year": int(
            forecast_week.isocalendar().week
        ),

        "profit_lag_1": profit_values[-1],
        "profit_lag_2": profit_values[-2],
        "profit_lag_4": profit_values[-4],

        "profit_rolling_4w": np.mean(
            profit_values[-4:]
        ),

        "profit_rolling_8w": np.mean(
            profit_values[-8:]
        ),

        "revenue_lag_1": revenue_values[-1],
        "revenue_lag_2": revenue_values[-2],
        "revenue_lag_4": revenue_values[-4],

        "revenue_rolling_4w": np.mean(
            revenue_values[-4:]
        ),

        "revenue_rolling_8w": np.mean(
            revenue_values[-8:]
        ),
    }])


def main():
    profit_df = pd.read_csv(
        PROFIT_DATA_PATH,
        parse_dates=["week"],
    ).sort_values("week").reset_index(drop=True)

    revenue_forecast = pd.read_csv(
        REVENUE_FORECAST_PATH,
        parse_dates=["week"],
    ).sort_values("week").reset_index(drop=True)

    training = profit_df.dropna(
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
        training[TARGET],
    )

    profit_history = profit_df[
        "gross_profit"
    ].dropna().copy()

    revenue_history = profit_df[
        "net_revenue"
    ].copy()

    last_week = profit_df["week"].iloc[-1]

    forecasts = []

    for _, revenue_row in revenue_forecast.iterrows():
        forecast_week = revenue_row["week"]
        forecast_revenue = float(
            revenue_row["forecast_net_revenue"]
        )

        X_future = build_features(
            profit_history,
            revenue_history,
            forecast_week,
        )

        predicted_profit = float(
            model.predict(X_future[FEATURES])[0]
        )

        predicted_profit = max(
            0.0,
            predicted_profit,
        )

        gross_margin = (
            predicted_profit
            / forecast_revenue
            * 100
            if forecast_revenue > 0
            else 0.0
        )

        forecasts.append({
            "week": forecast_week,
            "forecast_net_revenue": forecast_revenue,
            "forecast_gross_profit": predicted_profit,
            "forecast_gross_margin_pct": gross_margin,
        })

        # Recursive update:
        # use model forecast for both future revenue and profit.
        revenue_history = pd.concat(
            [
                revenue_history,
                pd.Series(
                    [forecast_revenue]
                ),
            ],
            ignore_index=True,
        )

        profit_history = pd.concat(
            [
                profit_history,
                pd.Series(
                    [predicted_profit]
                ),
            ],
            ignore_index=True,
        )

    forecast_df = pd.DataFrame(forecasts)

    os.makedirs(
        MODEL_DIR,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    output_path = (
        "data/processed/"
        "gross_profit_forecast_8_weeks.csv"
    )

    forecast_df.to_csv(
        output_path,
        index=False,
    )

    print("=" * 72)
    print("DEPLOYABLE GROSS PROFIT FORECAST")
    print("=" * 72)

    print(
        f"Training observations : {len(training)}"
    )

    print(
        f"Last historical week  : "
        f"{last_week.date()}"
    )

    print(
        "Forecast horizon       : 8 weeks"
    )

    print(
        "Model                  : Gradient Boosting"
    )

    print(
        "Revenue input          : "
        "Deployable revenue forecast"
    )

    print("-" * 72)

    print(
        forecast_df.to_string(
            index=False
        )
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
