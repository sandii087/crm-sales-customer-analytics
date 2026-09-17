import pandas as pd
import numpy as np

DATA_PATH = "data/processed/weekly_forecast_dataset.csv"


def smape(actual, predicted):
    actual = np.asarray(actual, dtype=float)
    predicted = np.asarray(predicted, dtype=float)

    denominator = (np.abs(actual) + np.abs(predicted)) / 2

    mask = denominator != 0

    return np.mean(
        np.abs(actual[mask] - predicted[mask]) / denominator[mask]
    ) * 100


def main():
    df = pd.read_csv(DATA_PATH, parse_dates=["week"])

    # Target
    target = "net_revenue"

    # Remove rows that do not have a valid target.
    df = df[df[target].notna()].copy()

    # Use the last 10 weeks as the chronological test set.
    test_size = 10

    train = df.iloc[:-test_size].copy()
    test = df.iloc[-test_size:].copy()

    # Simple persistence baseline:
    # prediction for the next week = previous week's observed revenue.
    test["prediction"] = test[target].shift(1)

    # First test prediction comes from the final training observation.
    test.loc[test.index[0], "prediction"] = train[target].iloc[-1]

    # Ignore weeks where the actual target is zero for percentage metrics.
    non_zero_test = test[test[target] > 0].copy()

    mae = np.mean(
        np.abs(
            non_zero_test[target] - non_zero_test["prediction"]
        )
    )

    rmse = np.sqrt(
        np.mean(
            (
                non_zero_test[target]
                - non_zero_test["prediction"]
            ) ** 2
        )
    )

    mape = np.mean(
        np.abs(
            (
                non_zero_test[target]
                - non_zero_test["prediction"]
            )
            / non_zero_test[target]
        )
    ) * 100

    baseline_smape = smape(
        non_zero_test[target],
        non_zero_test["prediction"],
    )

    print("=" * 72)
    print("BASELINE FORECAST EVALUATION")
    print("=" * 72)

    print(f"Training weeks          : {len(train)}")
    print(f"Test weeks              : {len(test)}")
    print(f"Test weeks with sales   : {len(non_zero_test)}")

    print("-" * 72)

    print(f"MAE                     : {mae:,.2f}")
    print(f"RMSE                    : {rmse:,.2f}")
    print(f"MAPE                    : {mape:.2f}%")
    print(f"sMAPE                   : {baseline_smape:.2f}%")

    print("-" * 72)

    print("TEST PREDICTIONS")
    print(
        test[
            ["week", target, "prediction"]
        ].to_string(index=False)
    )

    print("=" * 72)


if __name__ == "__main__":
    main()
