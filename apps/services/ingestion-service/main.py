"""
Ingestion Service (FastAPI)
Watcher, Queue, Status-Tracking für Dokument-Ingestion
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
from contextlib import asynccontextmanager

from src.watcher.file_watcher import FileWatcher
from src.queue.queue_manager import QueueManager
from src.processing.processor import DocumentProcessor

# Global services
file_watcher: Optional[FileWatcher] = None
queue_manager: Optional[QueueManager] = None
processor: Optional[DocumentProcessor] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown"""
    global file_watcher, queue_manager, processor

    # Startup
    queue_manager = QueueManager()
    processor = DocumentProcessor(queue_manager)
    file_watcher = FileWatcher(processor)

    # Start watcher
    file_watcher.start()

    yield

    # Shutdown
    if file_watcher:
        file_watcher.stop()
    if queue_manager:
        await queue_manager.close()


app = FastAPI(
    title="WattWeiser Ingestion Service",
    description="Document ingestion with file watching and queue management",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UploadResponse(BaseModel):
    document_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    document_id: str
    status: str
    progress: Optional[float] = None
    error: Optional[str] = None


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ingestion-service"}


@app.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    knowledge_space_id: Optional[str] = None,
):
    """Dokument hochladen und zur Verarbeitung in Queue einreihen"""
    if not processor:
        raise HTTPException(status_code=503, detail="Processor not initialized")

    try:
        # Datei lesen
        content = await file.read()

        # Zur Verarbeitung einreihen
        document_id = await processor.enqueue_document(
            file.filename or "unknown",
            content,
            knowledge_space_id,
        )

        return UploadResponse(
            document_id=document_id,
            status="queued",
            message="Document queued for processing",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/status/{document_id}", response_model=StatusResponse)
async def get_status(document_id: str):
    """Status eines Dokuments abrufen"""
    if not processor:
        raise HTTPException(status_code=503, detail="Processor not initialized")

    status = await processor.get_status(document_id)

    if not status:
        raise HTTPException(status_code=404, detail="Document not found")

    return StatusResponse(**status)


@app.get("/queue/stats")
async def get_queue_stats():
    """Queue-Statistiken abrufen"""
    if not queue_manager:
        raise HTTPException(status_code=503, detail="Queue manager not initialized")

    stats = await queue_manager.get_stats()
    return stats


@app.post("/watch/start")
async def start_watching(path: str):
    """File-Watcher für einen Pfad starten"""
    if not file_watcher:
        raise HTTPException(status_code=503, detail="File watcher not initialized")

    file_watcher.add_watch_path(path)
    return {"message": f"Watching started for path: {path}"}


@app.post("/watch/stop")
async def stop_watching(path: str):
    """File-Watcher für einen Pfad stoppen"""
    if not file_watcher:
        raise HTTPException(status_code=503, detail="File watcher not initialized")

    file_watcher.remove_watch_path(path)
    return {"message": f"Watching stopped for path: {path}"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3008, reload=True)


