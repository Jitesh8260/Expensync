"""
feature_extractor.py

RESPONSIBILITY: TF-IDF feature preparation with version safety.
Converts transaction text+metadata into numerical feature vectors.
Persists vectorizer alongside model for consistent feature spaces.
"""

import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from utils.config import TFIDF_MAX_FEATURES, MODEL_DIR


class FeatureExtractor:
    def __init__(self):
        self._vectorizer_cache = {}  # userId -> (vectorizer, version)

    def build_feature_string(self, title, canonical_merchant, intent, entity_type):
        """
        Construct a single feature string from transaction metadata.
        This is the input format for TF-IDF vectorization.
        """
        parts = [
            title or "",
            canonical_merchant or "",
            intent or "",
            entity_type or ""
        ]
        return " ".join(parts).lower().strip()

    def fit_vectorizer(self, texts, user_id, version):
        """
        Fit a new TF-IDF vectorizer on training texts and persist it.
        """
        vectorizer = TfidfVectorizer(max_features=TFIDF_MAX_FEATURES, stop_words="english")
        vectorizer.fit(texts)

        # Save versioned vectorizer
        path = self._vectorizer_path(user_id, version)
        with open(path, "wb") as f:
            pickle.dump(vectorizer, f)

        # Update cache
        self._vectorizer_cache[user_id] = (vectorizer, version)
        return vectorizer

    def transform(self, texts, user_id, version):
        """
        Transform texts using a fitted vectorizer.
        Loads from cache or disk. Raises if version mismatch.
        """
        vectorizer = self._load_vectorizer(user_id, version)
        if vectorizer is None:
            raise ValueError(f"No vectorizer found for user {user_id} v{version}")
        return vectorizer.transform(texts)

    def _load_vectorizer(self, user_id, version):
        """Load vectorizer from cache or disk."""
        # Check cache
        cached = self._vectorizer_cache.get(user_id)
        if cached and cached[1] == version:
            return cached[0]

        # Load from disk
        path = self._vectorizer_path(user_id, version)
        if not os.path.exists(path):
            return None

        with open(path, "rb") as f:
            vectorizer = pickle.load(f)

        self._vectorizer_cache[user_id] = (vectorizer, version)
        return vectorizer

    def _vectorizer_path(self, user_id, version):
        return os.path.join(MODEL_DIR, f"{user_id}_vectorizer_v{version}.pkl")


# Singleton
feature_extractor = FeatureExtractor()
