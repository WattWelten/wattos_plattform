"""
Document Processor
Verarbeitet Dokumente aus der Queue
"""
import asyncio
import hashlib
import aiohttp
from pathlib import Path
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Document Processor für Ingestion"""

    def __init__(self, queue_manager):
        self.queue_manager = queue_manager
        self.processing = False

    async def start_processing(self):
        """Verarbeitungs-Loop starten"""
        if self.processing:
            logger.warning("Processing already running")
            return

        self.processing = True
        logger.info("Started document processing loop")

        while self.processing:
            try:
                job = await self.queue_manager.dequeue()

                if job:
                    await self.process_job(job)
                else:
                    # Keine Jobs, kurz warten
                    await asyncio.sleep(1)

            except Exception as e:
                logger.error(f"Error in processing loop: {e}")
                await asyncio.sleep(5)

    async def stop_processing(self):
        """Verarbeitungs-Loop stoppen"""
        self.processing = False
        logger.info("Stopped document processing loop")

    async def enqueue_document(
        self, filename: str, content: bytes, knowledge_space_id: Optional[str] = None
    ) -> str:
        """Dokument zur Verarbeitung einreihen"""
        # Dokument-ID generieren (basierend auf Content-Hash)
        content_hash = hashlib.sha256(content).hexdigest()
        document_id = f"doc_{content_hash[:16]}"

        job_data = {
            "document_id": document_id,
            "filename": filename,
            "content": content.decode("utf-8", errors="ignore"),
            "knowledge_space_id": knowledge_space_id,
        }

        job_id = await self.queue_manager.enqueue(job_data)
        return document_id

    async def process_job(self, job: Dict[str, Any]):
        """Job verarbeiten"""
        job_id = job["id"]
        job_data = job["data"]

        try:
            logger.info(f"Processing job: {job_id}")

            # Status: Processing
            await self.queue_manager.update_status(job_id, "processing", progress=0.1)

            document_id = job_data.get("document_id")
            filename = job_data.get("filename")
            content = job_data.get("content", "")
            knowledge_space_id = job_data.get("knowledge_space_id")

            # 1. Dokument in DB speichern (wenn nicht vorhanden)
            # TODO: Integration mit Prisma/DB über HTTP API
            # document = await self.create_document(document_id, filename, knowledge_space_id)

            # 2. Dokument verarbeiten über Document-Processor-Service
            # (Für jetzt: Direkte Verarbeitung, später: HTTP-Call zu Node-Service)
            await self.queue_manager.update_status(job_id, "processing", progress=0.3)

            # Chunking (vereinfacht)
            chunks = self._chunk_content(content, document_id)

            await self.queue_manager.update_status(job_id, "processing", progress=0.5)

            # Embeddings generieren (über LLM-Gateway)
            embeddings = await self._generate_embeddings(chunks)

            await self.queue_manager.update_status(job_id, "processing", progress=0.7)

            # PII-Redaction (vereinfacht)
            redacted_chunks = self._redact_pii(chunks)

            await self.queue_manager.update_status(job_id, "processing", progress=0.8)

            # In Vector Store speichern (über RAG-Service)
            await self._store_vectors(document_id, redacted_chunks, embeddings, knowledge_space_id)

            await self.queue_manager.update_status(job_id, "processing", progress=0.9)

            # Chunks in DB speichern
            # TODO: Integration mit DB über HTTP API
            # await self._save_chunks_to_db(document_id, redacted_chunks, embeddings)

            # Status: Completed
            await self.queue_manager.update_status(job_id, "completed", progress=1.0)

            logger.info(f"Job completed: {job_id}")

        except Exception as e:
            logger.error(f"Job failed: {job_id} - {e}")
            await self.queue_manager.update_status(
                job_id, "failed", error=str(e)
            )

    def _chunk_content(self, content: str, document_id: str, chunk_size: int = 1000, overlap: int = 200) -> list:
        """Einfaches Chunking"""
        chunks = []
        start = 0
        chunk_index = 0

        while start < len(content):
            end = min(start + chunk_size, len(content))
            chunk_content = content[start:end]

            chunks.append({
                "id": f"{document_id}_chunk_{chunk_index}",
                "document_id": document_id,
                "content": chunk_content,
                "chunk_index": chunk_index,
                "start_char": start,
                "end_char": end,
                "metadata": {
                    "strategy": "fixed",
                    "chunk_size": chunk_size,
                    "overlap": overlap,
                },
            })

            start = end - overlap
            chunk_index += 1

        return chunks

    async def _generate_embeddings(self, chunks: list) -> list:
        """Embeddings über LLM-Gateway generieren"""
        import os

        embeddings = []
        llm_gateway_url = os.getenv("LLM_GATEWAY_URL", "http://localhost:3002")

        async with aiohttp.ClientSession() as session:
            for chunk in chunks:
                try:
                    # Embedding über LLM-Gateway anfordern
                    async with session.post(
                        f"{llm_gateway_url}/v1/embeddings",
                        json={
                            "model": "text-embedding-3-small",
                            "input": chunk["content"],
                        },
                        headers={"Content-Type": "application/json"},
                    ) as response:
                        if response.status == 200:
                            data = await response.json()
                            embedding = data.get("data", [{}])[0].get("embedding", [])
                            embeddings.append(embedding)
                        else:
                            logger.warning(f"Failed to generate embedding for chunk {chunk['id']}")
                            embeddings.append([])  # Fallback: leeres Embedding
                except Exception as e:
                    logger.error(f"Error generating embedding: {e}")
                    embeddings.append([])

        return embeddings

    def _redact_pii(self, chunks: list) -> list:
        """Einfache PII-Redaction (vereinfacht)"""
        import re

        pii_patterns = {
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "phone": r"\b(\+49|0)[1-9]\d{1,14}\b",
            "iban": r"\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}\b",
        }

        redacted_chunks = []
        for chunk in chunks:
            content = chunk["content"]
            for pii_type, pattern in pii_patterns.items():
                content = re.sub(pattern, f"[{pii_type.upper()}_REDACTED]", content)

            redacted_chunk = chunk.copy()
            redacted_chunk["content"] = content
            redacted_chunk["metadata"]["pii_redacted"] = True
            redacted_chunks.append(redacted_chunk)

        return redacted_chunks

    async def _store_vectors(self, document_id: str, chunks: list, embeddings: list, knowledge_space_id: Optional[str]):
        """Vektoren in Vector Store speichern (über RAG-Service)"""
        import os

        rag_service_url = os.getenv("RAG_SERVICE_URL", "http://localhost:3005")

        # Vektoren für RAG-Service vorbereiten
        vectors = []
        for chunk, embedding in zip(chunks, embeddings):
            if embedding:  # Nur wenn Embedding vorhanden
                vectors.append({
                    "id": chunk["id"],
                    "content": chunk["content"],
                    "embedding": embedding,
                    "metadata": {
                        **chunk["metadata"],
                        "document_id": document_id,
                        "knowledge_space_id": knowledge_space_id,
                    },
                })

        if vectors:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        f"{rag_service_url}/vectors/upsert",
                        json={"vectors": vectors},
                        headers={"Content-Type": "application/json"},
                    ) as response:
                        if response.status != 200:
                            logger.warning(f"Failed to store vectors: {response.status}")
            except Exception as e:
                logger.error(f"Error storing vectors: {e}")

    async def handle_file(self, file_path: str):
        """Datei-Event verarbeiten"""
        try:
            path = Path(file_path)

            if not path.exists():
                logger.warning(f"File does not exist: {file_path}")
                return

            # Datei lesen
            with open(path, "rb") as f:
                content = f.read()

            # Zur Verarbeitung einreihen
            await self.enqueue_document(path.name, content)

            logger.info(f"File queued for processing: {file_path}")

        except Exception as e:
            logger.error(f"Error handling file: {file_path} - {e}")

    async def get_status(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Status eines Dokuments abrufen"""
        # TODO: Status aus Queue oder DB abrufen
        # Für jetzt: Placeholder
        return {
            "document_id": document_id,
            "status": "processing",
            "progress": 0.5,
        }
