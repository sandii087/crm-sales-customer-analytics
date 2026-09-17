import os
import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import GradientBoostingRegressor

DATA_PATH = "data/processed/weekly_profit_forecast_dataset.csv"
REVENUE_FORECAST_PATH = "data/processed/revenue_forecast_8_weeks.csv"

MODEL_DIR = "models"
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "deployable_gross_margin_forecaster.joblib"
)

OUTPUT_PATH = (
    "data/processed/"
    "business_forecast_8_weeks.csv"
)

TARGET = "gross_margin_pct"

FEATURES = [
    "year",
    "month",
    "quarter",
    "week_of_year",
    "margin_lag_1",
    "margin_lag_2",
    "margin_lag_4",
    "margin_rolling_4w",
    "margin_rolling_8w",
    "revenue_lag_1",
    "revenue_lag_2",
    "revenue_lag_4",
    "revenue_rolling_4w",
    "revenue_rolling_8w",
]


def build_features(
    margin_history,
    revenue_history,
    forecast_week,
):
    margin_values = margin_history.tolist()
    revenue_values = revenue_history.tolist()

    return pd.DataFrame([{
        "year": forecast_week.year,
        "month": forecast_week.month,
        "quarter": forecast_week.quarter,
        "week_of_year": int(
            forecast_week.isocalendar().week
        ),

        "margin_lag_1": margin_values[-1],
        "margin_lag_2": margin_values[-2],
        "margin_lag_4": margin_values[-4],

        "margin_rolling_4w": np.mean(
            margin_values[-4:]
        ),

        "margin_rolling_8w": np.mean(
            margin_values[-8:]
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
    df = pd.read_csv(
        DATA_PATH,
        parse_dates=["week"],
    ).sort_values("week").reset_index(drop=True)

    revenue_forecast = pd.read_csv(
        REVENUE_FORECAST_PATH,
        parse_dates=["week"],
    ).sort_values("week").reset_index(drop=True)

    # Only weeks with actual revenue have a meaningful margin.
    training = df.dropna(
        subset=FEATURES + [TARGET]
    ).copy()

    historical_min_margin = float(
        training[TARGET].min()
    )

    historical_max_margin = float(
        training[TARGET].max()
    )

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

    margin_history = training[
        TARGET
    ].copy()

    revenue_history = df[
        "net_revenue"
    ].copy()

    forecasts = []

    for _, revenue_row in revenue_forecast.iterrows():
        forecast_week = revenue_row["week"]

        forecast_revenue = float(
            revenue_row["forecast_net_revenue"]
        )

        X_future = build_features(
            margin_history,
            revenue_history,
            forecast_week,
        )

        predicted_margin = float(
            model.predict(
                X_future[FEATURES]
            )[0]
        )

        # Prevent impossible margins outside the
        # historically observed transaction range.
        predicted_margin = float(
            np.clip(
                predicted_margin,
                historical_min_margin,
                historical_max_margin,
            )
        )

        predicted_profit = (
            forecast_revenue
            * predicted_margin
            / 100.0
        )

        forecasts.append({
            "week": forecast_week,
            "forecast_net_revenue": forecast_revenue,
            "forecast_gross_margin_pct": predicted_margin,
            "forecast_gross_profit": predicted_profit,
        })

        # Recursive update.
        margin_history = pd.concat(
            [
                margin_history,
                pd.Series([predicted_margin]),
            ],
            ignore_index=True,
        )

        revenue_history = pd.concat(
            [
                revenue_history,
                pd.Series([forecast_revenue]),
            ],
            ignore_index=True,
        )

    forecast_df = pd.DataFrame(
        forecasts
    )

    os.makedirs(
        MODEL_DIR,
        exist_ok=True,
    )

    joblib.dump(
        model,
        MODEL_PATH,
    )

    forecast_df.to_csv(
        OUTPUT_PATH,
        index=False,
    )

    print("=" * 72)
    print("DEPLOYABLE BUSINESS FORECAST")
    print("=" * 72)

    print(
        f"Training observations : {len(training)}"
    )

    print(
        f"Historical margin range: "
        f"{historical_min_margin:.2f}% - "
        f"{historical_max_margin:.2f}%"
    )

    print(
        "Forecast horizon       : 8 weeks"
    )

    print(
        "Revenue model          : Gradient Boosting"
    )

    print(
        "Margin model           : Gradient Boosting"
    )

    print("-" * 72)

    print(
        forecast_df.to_string(
            index=False
        )
    )

    print("-" * 72)

    print(
        f"Margin model saved     : {MODEL_PATH}"
    )

    print(
        f"Business forecast saved: {OUTPUT_PATH}"
    )

    print("=" * 72)


if __name__ == "__main__":
    main()
