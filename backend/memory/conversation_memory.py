"""
Conversation memory backed by ChromaDB when available.

Falls back to a small JSON store so the app still works if Chroma is not
installed in the local environment.
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, List, Optional

from database import CHROMA_DIR, MEMORY_FILE, ensure_storage_paths


def _tokenize(text: str) -> List[str]:
    return [token for token in text.lower().replace("/", " ").split() if token]


class _HashEmbeddingFunction:
    """Small deterministic embedding function for local Chroma collections."""

    def __init__(self, dimensions: int = 96):
        self.dimensions = dimensions

    def _embed(self, text: str) -> List[float]:
        vector = [0.0] * self.dimensions
        for token in _tokenize(text):
            index = int(sha256(token.encode("utf-8")).hexdigest(), 16) % self.dimensions
            vector[index] += 1.0
        norm = sum(value * value for value in vector) ** 0.5
        return [value / norm for value in vector] if norm else vector

    def __call__(self, input: List[str]) -> List[List[float]]:
        return [self._embed(text) for text in input]


class ConversationMemory:
    """Stores user chats, symptoms, and recommendations for later recall."""

    def __init__(self) -> None:
        ensure_storage_paths()
        self._fallback_file = Path(MEMORY_FILE)
        self._fallback_store = self._load_fallback_store()
        self._chromadb_client = None
        self._collection = None
        self._init_chroma()

    def _load_fallback_store(self) -> Dict[str, List[Dict[str, Any]]]:
        if not self._fallback_file.exists():
            return defaultdict(list)  # type: ignore[return-value]
        try:
            return json.loads(self._fallback_file.read_text(encoding="utf-8"))
        except Exception:
            return defaultdict(list)  # type: ignore[return-value]

    def _save_fallback_store(self) -> None:
        self._fallback_file.write_text(
            json.dumps(self._fallback_store, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def _init_chroma(self) -> None:
        try:
            import chromadb

            self._chromadb_client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            self._collection = self._chromadb_client.get_or_create_collection(
                name="conversation_memory",
                embedding_function=_HashEmbeddingFunction(),
            )
        except Exception:
            self._chromadb_client = None
            self._collection = None

    def record_turn(
        self,
        user_id: int,
        message: str,
        response: str,
        symptoms: Optional[List[str]] = None,
        recommendations: Optional[List[str]] = None,
        priority: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        entry = {
            "user_id": user_id,
            "message": message,
            "response": response,
            "symptoms": symptoms or [],
            "recommendations": recommendations or [],
            "priority": priority,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat(),
        }

        key = str(user_id)
        self._fallback_store.setdefault(key, [])
        self._fallback_store[key].append(entry)
        self._save_fallback_store()

        if self._collection is not None:
            doc_id = f"{user_id}-{len(self._fallback_store[key])}-{datetime.utcnow().timestamp()}"
            document = f"User: {message}\nAssistant: {response}"
            self._collection.add(
                ids=[doc_id],
                documents=[document],
                metadatas=[{
                    "user_id": str(user_id),
                    "priority": priority or "unknown",
                    "timestamp": entry["timestamp"],
                }],
            )

    def get_history(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        history = list(self._fallback_store.get(str(user_id), []))
        return history[-limit:]

    def get_recent_symptoms(self, user_id: int, limit: int = 5) -> List[str]:
        symptoms: List[str] = []
        for turn in self.get_history(user_id, limit=limit):
            symptoms.extend(turn.get("symptoms", []))
        seen = []
        for symptom in symptoms:
            if symptom not in seen:
                seen.append(symptom)
        return seen[-limit:]

    def get_recent_recommendations(self, user_id: int, limit: int = 5) -> List[str]:
        recommendations: List[str] = []
        for turn in self.get_history(user_id, limit=limit):
            recommendations.extend(turn.get("recommendations", []))
        seen = []
        for recommendation in recommendations:
            if recommendation not in seen:
                seen.append(recommendation)
        return seen[-limit:]

    def search(self, query: str, user_id: Optional[int] = None, top_k: int = 4) -> List[Dict[str, Any]]:
        if self._collection is not None:
            try:
                result = self._collection.query(
                    query_texts=[query],
                    n_results=top_k,
                    where={"user_id": str(user_id)} if user_id is not None else None,
                )
                documents = result.get("documents", [[]])[0]
                metadatas = result.get("metadatas", [[]])[0]
                return [
                    {"document": document, "metadata": metadata}
                    for document, metadata in zip(documents, metadatas)
                ]
            except Exception:
                pass

        query_tokens = set(_tokenize(query))
        scored: List[Dict[str, Any]] = []
        for entry in self.get_history(user_id or 0, limit=50):
            haystack = " ".join([
                entry.get("message", ""),
                entry.get("response", ""),
                " ".join(entry.get("symptoms", [])),
                " ".join(entry.get("recommendations", [])),
            ])
            score = len(query_tokens.intersection(_tokenize(haystack)))
            if score:
                scored.append({"score": score, "entry": entry})
        scored.sort(key=lambda item: item["score"], reverse=True)
        return [{"document": item["entry"]["response"], "metadata": item["entry"]} for item in scored[:top_k]]
