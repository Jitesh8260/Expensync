"""
knn_classifier.py

RESPONSIBILITY: KNN category prediction with production safeguards.
- In-memory model caching (load once, reuse across requests)
- Model versioning with metadata sidecar
- Synthetic bootstrap fallback for cold-start users
"""

import os
import json
import pickle
from datetime import datetime
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import cross_val_score
from utils.config import MODEL_DIR, KNN_NEIGHBORS, VALID_CATEGORIES, MAX_MODEL_VERSIONS
from services.feature_extractor import feature_extractor


class KNNClassifier:
    def __init__(self):
        self._model_cache = {}  # userId -> (model, version)

    def predict(self, user_id, text, canonical_merchant, entity_type, intent):
        """
        Predict category for a transaction.
        Returns { category, probability, modelVersion } or { category: None, error: ... }
        """
        metadata = self._load_metadata(user_id)
        if metadata is None:
            # Cold-start user: automatically train initial model using bootstrap data
            try:
                from training.train import train_user_model
                metadata = train_user_model(user_id, force=True)
            except Exception as e:
                return {"category": None, "probability": 0, "error": f"bootstrap_training_failed: {str(e)}"}
            
            if not metadata or not metadata.get("success"):
                return {"category": None, "probability": 0, "error": "no_model"}

        version = metadata["modelVersion"]

        # Load model
        model = self._load_model(user_id, version)
        if model is None:
            return {"category": None, "probability": 0, "error": "no_model"}

        # Build feature string and transform
        try:
            feature_str = feature_extractor.build_feature_string(
                text, canonical_merchant, intent, entity_type
            )
            X = feature_extractor.transform([feature_str], user_id, version)
        except ValueError as e:
            return {"category": None, "probability": 0, "error": str(e)}

        # Predict with probability
        predicted = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]
        max_prob = float(max(probabilities))
        prob_dist = {str(c): round(float(p), 3) for c, p in zip(model.classes_, probabilities)}

        return {
            "category": predicted,
            "probability": round(max_prob, 3),
            "probabilityDistribution": prob_dist,
            "modelVersion": version
        }

    def train(self, user_id, features, labels):
        """
        Train a new KNN model for a user.
        features: list of feature strings
        labels: list of category labels
        Returns metadata dict.
        """
        # Determine version
        current_metadata = self._load_metadata(user_id)
        new_version = (current_metadata["modelVersion"] + 1) if current_metadata else 1

        # Fit vectorizer
        vectorizer = feature_extractor.fit_vectorizer(features, user_id, new_version)
        X = vectorizer.transform(features)

        # Train KNN
        model = KNeighborsClassifier(n_neighbors=min(KNN_NEIGHBORS, len(features)), weights="distance")
        model.fit(X, labels)

        # Cross-validation accuracy estimate (if enough samples)
        accuracy = 0.0
        if len(features) >= 10:
            try:
                cv_folds = min(5, len(features))
                scores = cross_val_score(model, X, labels, cv=cv_folds, scoring="accuracy")
                accuracy = round(float(scores.mean()), 3)
            except Exception:
                accuracy = 0.0

        # Category distribution
        distribution = {}
        for label in labels:
            distribution[label] = distribution.get(label, 0) + 1

        # Metadata
        metadata = {
            "trainedAt": datetime.utcnow().isoformat() + "Z",
            "trainingSampleCount": len(features),
            "accuracyEstimate": accuracy,
            "categoryDistribution": distribution,
            "modelVersion": new_version,
            "vectorizerVersion": new_version,
            "correctionsSinceLastTrain": 0
        }

        # Save model
        model_path = os.path.join(MODEL_DIR, f"{user_id}_knn_v{new_version}.pkl")
        with open(model_path, "wb") as f:
            pickle.dump(model, f)

        # Save metadata
        meta_path = os.path.join(MODEL_DIR, f"{user_id}_metadata.json")
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        # Update cache
        self._model_cache[user_id] = (model, new_version)

        # Cleanup old versions
        self._cleanup_old_versions(user_id, new_version)

        return metadata

    def _load_model(self, user_id, version):
        """Load model from cache or disk."""
        cached = self._model_cache.get(user_id)
        if cached and cached[1] == version:
            return cached[0]

        path = os.path.join(MODEL_DIR, f"{user_id}_knn_v{version}.pkl")
        if not os.path.exists(path):
            return None

        with open(path, "rb") as f:
            model = pickle.load(f)

        self._model_cache[user_id] = (model, version)
        return model

    def _load_metadata(self, user_id):
        """Load metadata JSON for a user."""
        path = os.path.join(MODEL_DIR, f"{user_id}_metadata.json")
        if not os.path.exists(path):
            return None
        with open(path, "r") as f:
            return json.load(f)

    def _cleanup_old_versions(self, user_id, current_version):
        """Remove old model/vectorizer files beyond MAX_MODEL_VERSIONS."""
        for v in range(1, current_version - MAX_MODEL_VERSIONS + 1):
            for suffix in ["_knn_v", "_vectorizer_v"]:
                path = os.path.join(MODEL_DIR, f"{user_id}{suffix}{v}.pkl")
                if os.path.exists(path):
                    try:
                        os.remove(path)
                    except OSError:
                        pass


# Singleton
knn_classifier = KNNClassifier()
