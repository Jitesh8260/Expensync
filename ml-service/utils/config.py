"""
Centralized configuration for the ML microservice.
"""
import os

# Securely load server/.env or local ml-service/.env if available (pure Python, zero external dependencies)
server_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "server", ".env")
ml_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")

for env_path in [server_env, ml_env]:
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    if k not in os.environ:
                        os.environ[k] = v.strip()

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/expensync")
MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
VALID_CATEGORIES = ["Food", "Entertainment", "Travel", "Utilities", "Income", "Others"]
KNN_NEIGHBORS = 5
TFIDF_MAX_FEATURES = 200
MIN_TRAINING_SAMPLES = 30
MAX_MODEL_VERSIONS = 2  # Keep last N versions for rollback

# Ensure model directory exists
os.makedirs(MODEL_DIR, exist_ok=True)
