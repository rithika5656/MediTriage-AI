"""
Shared storage paths for the agentic backend.
"""
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
STORAGE_ROOT = BACKEND_ROOT / "storage"
UPLOAD_DIR = STORAGE_ROOT / "uploads"
CHROMA_DIR = STORAGE_ROOT / "chroma"
REPORT_DIR = STORAGE_ROOT / "reports"
MEMORY_FILE = STORAGE_ROOT / "conversation_memory.json"


def ensure_storage_paths() -> None:
    """Create storage folders used by uploads, memory, and reports."""
    for path in (STORAGE_ROOT, UPLOAD_DIR, CHROMA_DIR, REPORT_DIR):
        path.mkdir(parents=True, exist_ok=True)
