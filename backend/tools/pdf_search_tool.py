"""
PDF search tool backed by the medical knowledge store.
"""
from __future__ import annotations

from typing import Any, Dict, List

from rag import MedicalKnowledgeStore


class PDFSearchTool:
    def __init__(self, knowledge_store: MedicalKnowledgeStore) -> None:
        self.knowledge_store = knowledge_store

    def search(self, query: str, top_k: int = 4, user_id: int | None = None) -> List[Dict[str, Any]]:
        return self.knowledge_store.search(query=query, top_k=top_k, user_id=user_id)
