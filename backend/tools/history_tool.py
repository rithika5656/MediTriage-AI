"""
Patient history tool built on top of the conversation memory store.
"""
from __future__ import annotations

from typing import Any, Dict, List

from memory import ConversationMemory


class PatientHistoryTool:
    def __init__(self, memory: ConversationMemory) -> None:
        self.memory = memory

    def get_recent_context(self, user_id: int, limit: int = 5) -> List[Dict[str, Any]]:
        return self.memory.get_history(user_id, limit=limit)

    def get_recent_symptoms(self, user_id: int, limit: int = 5) -> List[str]:
        return self.memory.get_recent_symptoms(user_id, limit=limit)

    def get_recent_recommendations(self, user_id: int, limit: int = 5) -> List[str]:
        return self.memory.get_recent_recommendations(user_id, limit=limit)
