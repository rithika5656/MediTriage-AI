"""
Retrieval-augmented medical research agent.
"""
from __future__ import annotations

import os
from typing import Any, Dict, List

from tools.pdf_search_tool import PDFSearchTool


class MedicalResearchAgent:
    def __init__(self, pdf_search_tool: PDFSearchTool) -> None:
        self.pdf_search_tool = pdf_search_tool
        self._langchain_available = False
        self._llm_chain = None
        self._Document = None
        self._initialize_langchain()

    def _initialize_langchain(self) -> None:
        try:
            from langchain.chains.question_answering import load_qa_chain
            from langchain.docstore.document import Document
            from langchain.llms import OpenAI

            self._Document = Document
            self._llm_chain = load_qa_chain(OpenAI(temperature=0), chain_type="stuff")
            self._langchain_available = True
        except Exception:
            self._langchain_available = False
            self._llm_chain = None
            self._Document = None

    def research(self, query: str, user_id: int | None = None) -> Dict[str, Any]:
        hits = self.pdf_search_tool.search(query=query, user_id=user_id)
        if hits:
            citations = []
            answer_fragments: List[str] = []
            for hit in hits:
                citations.append({
                    "source": hit.get("source") or hit.get("file_name") or "uploaded_document",
                    "chunk_index": hit.get("chunk_index"),
                })
                answer_fragments.append(hit.get("document", "").strip())

            answer = self._compose_answer(query=query, hits=hits)
            return {
                "used_rag": True,
                "answer": answer,
                "citations": citations,
                "retrieved_context": hits,
            }

        return {
            "used_rag": False,
            "answer": "This answer is based on general medical knowledge.",
            "citations": [],
            "retrieved_context": [],
        }

    def _compose_answer(self, query: str, hits: List[Dict[str, Any]]) -> str:
        if self._langchain_available and self._Document and self._llm_chain and os.getenv("OPENAI_API_KEY"):
            try:
                documents = [
                    self._Document(page_content=hit["document"], metadata={
                        "source": hit.get("source"),
                        "chunk_index": hit.get("chunk_index"),
                    })
                    for hit in hits
                ]
                return self._llm_chain.run(input_documents=documents, question=query)
            except Exception:
                pass

        summarized_fragments = []
        for hit in hits[:2]:
            source = hit.get("source") or hit.get("file_name") or "uploaded document"
            snippet = hit.get("document", "").replace("\n", " ")
            summarized_fragments.append(f"[{source}] {snippet[:280].strip()}")

        return (
            "Retrieved relevant medical document context. "
            + " ".join(summarized_fragments)
        )
