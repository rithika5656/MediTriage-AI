"""
Medical document indexing and retrieval.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from hashlib import sha256
from pathlib import Path
from typing import Any, Dict, List, Optional

from database import CHROMA_DIR, ensure_storage_paths


def _tokenize(text: str) -> List[str]:
    tokens = []
    for raw_token in text.lower().replace("\n", " ").split():
        token = "".join(character for character in raw_token if character.isalnum())
        if token:
            tokens.append(token)
    return tokens


class _HashEmbeddingFunction:
    def __init__(self, dimensions: int = 128):
        self.dimensions = dimensions

    def _embed(self, text: str) -> List[float]:
        vector = [0.0] * self.dimensions
        for token in _tokenize(text):
            slot = int(sha256(token.encode("utf-8")).hexdigest(), 16) % self.dimensions
            vector[slot] += 1.0
        norm = math.sqrt(sum(value * value for value in vector))
        return [value / norm for value in vector] if norm else vector

    def __call__(self, input: List[str]) -> List[List[float]]:
        return [self._embed(text) for text in input]


@dataclass
class SearchHit:
    text: str
    source: str
    chunk_index: int
    score: float


class MedicalKnowledgeStore:
    def __init__(self) -> None:
        ensure_storage_paths()
        self._client = None
        self._collection = None
        self._documents: List[Dict[str, Any]] = []
        self._init_chroma()

    def _init_chroma(self) -> None:
        try:
            import chromadb

            self._client = chromadb.PersistentClient(path=str(CHROMA_DIR))
            self._collection = self._client.get_or_create_collection(
                name="medical_documents",
                embedding_function=_HashEmbeddingFunction(),
            )
        except Exception:
            self._client = None
            self._collection = None

    def _split_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 150) -> List[str]:
        chunks = []
        cursor = 0
        while cursor < len(text):
            chunk = text[cursor : cursor + chunk_size].strip()
            if chunk:
                chunks.append(chunk)
            cursor += max(chunk_size - overlap, 1)
        return chunks

    def ingest_pdf(self, file_path: str, document_name: Optional[str] = None) -> Dict[str, Any]:
        from pypdf import PdfReader

        path = Path(file_path)
        reader = PdfReader(str(path))
        raw_text = "\n".join(page.extract_text() or "" for page in reader.pages)
        chunks = self._split_chunks(raw_text)
        source_name = document_name or path.stem

        if self._collection is not None:
            ids = [f"{source_name}-{index}" for index in range(len(chunks))]
            metadatas = [
                {"source": source_name, "chunk_index": index, "file_name": path.name}
                for index in range(len(chunks))
            ]
            self._collection.add(ids=ids, documents=chunks, metadatas=metadatas)
        else:
            for index, chunk in enumerate(chunks):
                self._documents.append(
                    {
                        "source": source_name,
                        "chunk_index": index,
                        "file_name": path.name,
                        "document": chunk,
                    }
                )

        return {"source": source_name, "chunks_indexed": len(chunks), "file_name": path.name}

    def has_documents(self) -> bool:
        if self._collection is not None:
            try:
                return self._collection.count() > 0
            except Exception:
                return False
        return bool(self._documents)

    def search(self, query: str, top_k: int = 4, user_id: Optional[int] = None) -> List[Dict[str, Any]]:
        if self._collection is not None:
            try:
                result = self._collection.query(query_texts=[query], n_results=top_k)
                documents = result.get("documents", [[]])[0]
                metadatas = result.get("metadatas", [[]])[0]
                return [
                    {
                        "document": document,
                        "source": metadata.get("source"),
                        "chunk_index": metadata.get("chunk_index"),
                        "file_name": metadata.get("file_name"),
                    }
                    for document, metadata in zip(documents, metadatas)
                ]
            except Exception:
                pass

        query_tokens = set(_tokenize(query))
        scored: List[SearchHit] = []
        for entry in self._documents:
            text_tokens = set(_tokenize(entry["document"]))
            overlap = len(query_tokens.intersection(text_tokens))
            if overlap:
                scored.append(
                    SearchHit(
                        text=entry["document"],
                        source=entry["source"],
                        chunk_index=entry["chunk_index"],
                        score=float(overlap),
                    )
                )
        scored.sort(key=lambda item: item.score, reverse=True)
        return [
            {
                "document": hit.text,
                "source": hit.source,
                "chunk_index": hit.chunk_index,
                "score": hit.score,
            }
            for hit in scored[:top_k]
        ]
