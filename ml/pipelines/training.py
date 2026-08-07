import os
import joblib
import numpy as np
from pathlib import Path
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

try:
    from .generate_dataset import generate_ahhe_pricing_dataset
except ImportError:
    from generate_dataset import generate_ahhe_pricing_dataset

def train_and_export_pricing_model():
    """
    Trains a Scikit-Learn RandomForestRegressor pipeline for dynamic homestay pricing,
    evaluates performance metrics, and serializes the model artifact into the Django app models directory.
    """
    print("Generating synthetic AHHE historical stay dataset...")
    df = generate_ahhe_pricing_dataset(num_samples=3000, random_state=42)

    X = df.drop(columns=['suggested_price'])
    y = df['suggested_price']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    categorical_features = ['pol_name', 'room_type', 'festival_tag']
    numerical_features = ['max_guests', 'heritage_verified', 'days_to_event']

    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features),
            ('num', 'passthrough', numerical_features)
        ]
    )

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42))
    ])

    print("Training RandomForestRegressor pricing model...")
    model_pipeline.fit(X_train, y_train)

    # Evaluation
    y_pred = model_pipeline.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = r2_score(y_test, y_pred)

    print("\n--- Model Evaluation Results ---")
    print(f"Mean Absolute Error (MAE): INR {mae:.2f}")
    print(f"Root Mean Squared Error (RMSE): INR {rmse:.2f}")
    print(f"R2 Score: {r2:.4f}")

    # Export paths
    root_dir = Path(__file__).resolve().parent.parent.parent
    backend_model_dir = root_dir / 'backend' / 'apps' / 'analytics_ml' / 'models'
    ml_model_dir = root_dir / 'ml' / 'models'

    backend_model_dir.mkdir(parents=True, exist_ok=True)
    ml_model_dir.mkdir(parents=True, exist_ok=True)

    backend_export_path = backend_model_dir / 'price_model.joblib'
    ml_export_path = ml_model_dir / 'price_model.joblib'

    joblib.dump(model_pipeline, backend_export_path)
    joblib.dump(model_pipeline, ml_export_path)

    print(f"\nModel successfully serialized to:")
    print(f" - Backend: {backend_export_path}")
    print(f" - ML workspace: {ml_export_path}")

    return model_pipeline

if __name__ == '__main__':
    train_and_export_pricing_model()
