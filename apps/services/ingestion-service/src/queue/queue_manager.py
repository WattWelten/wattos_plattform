"""
Queue Manager
Verwaltet BullMQ-ähnliche Queue für Dokument-Verarbeitung
"""
import redis
import json
import uuid
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class QueueManager:
    """Queue Manager für Dokument-Verarbeitung"""

    def __init__(self, redis_url: Optional[str] = None):
        self.redis_url = redis_url or "redis://localhost:6379"
        self.redis_client: Optional[redis.Redis] = None
        self.queue_name = "document_processing"

    async def connect(self):
        """Redis-Verbindung herstellen"""
        try:
            self.redis_client = redis.from_url(self.redis_url, decode_responses=True)
            # Test-Verbindung
            self.redis_client.ping()
            logger.info("Connected to Redis")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def enqueue(self, job_data: Dict[str, Any]) -> str:
        """Job in Queue einreihen"""
        if not self.redis_client:
            await self.connect()

        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "data": job_data,
            "status": "queued",
            "created_at": datetime.utcnow().isoformat(),
        }

        # In Queue einreihen
        self.redis_client.lpush(f"{self.queue_name}:queue", json.dumps(job))

        # Status speichern
        self.redis_client.set(
            f"{self.queue_name}:status:{job_id}",
            json.dumps(job),
            ex=86400,  # 24 Stunden TTL
        )

        logger.info(f"Job enqueued: {job_id}")
        return job_id

    async def dequeue(self) -> Optional[Dict[str, Any]]:
        """Job aus Queue holen"""
        if not self.redis_client:
            await self.connect()

        job_json = self.redis_client.brpop(f"{self.queue_name}:queue", timeout=1)

        if job_json:
            job = json.loads(job_json[1])
            job["status"] = "processing"
            job["started_at"] = datetime.utcnow().isoformat()

            # Status aktualisieren
            self.redis_client.set(
                f"{self.queue_name}:status:{job['id']}",
                json.dumps(job),
                ex=86400,
            )

            return job

        return None

    async def update_status(
        self, job_id: str, status: str, progress: Optional[float] = None, error: Optional[str] = None
    ):
        """Job-Status aktualisieren"""
        if not self.redis_client:
            await self.connect()

        status_key = f"{self.queue_name}:status:{job_id}"
        job_json = self.redis_client.get(status_key)

        if job_json:
            job = json.loads(job_json)
            job["status"] = status
            job["updated_at"] = datetime.utcnow().isoformat()

            if progress is not None:
                job["progress"] = progress

            if error:
                job["error"] = error

            if status in ["completed", "failed"]:
                job["completed_at"] = datetime.utcnow().isoformat()

            self.redis_client.set(status_key, json.dumps(job), ex=86400)
            logger.info(f"Job status updated: {job_id} -> {status}")

    async def get_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Job-Status abrufen"""
        if not self.redis_client:
            await self.connect()

        status_key = f"{self.queue_name}:status:{job_id}"
        job_json = self.redis_client.get(status_key)

        if job_json:
            return json.loads(job_json)

        return None

    async def get_stats(self) -> Dict[str, Any]:
        """Queue-Statistiken abrufen"""
        if not self.redis_client:
            await self.connect()

        queue_length = self.redis_client.llen(f"{self.queue_name}:queue")

        # Status-Keys zählen
        status_keys = self.redis_client.keys(f"{self.queue_name}:status:*")
        statuses = {}

        for key in status_keys:
            job_json = self.redis_client.get(key)
            if job_json:
                job = json.loads(job_json)
                status = job.get("status", "unknown")
                statuses[status] = statuses.get(status, 0) + 1

        return {
            "queue_length": queue_length,
            "statuses": statuses,
            "total_jobs": len(status_keys),
        }

    async def close(self):
        """Verbindung schließen"""
        if self.redis_client:
            self.redis_client.close()
            logger.info("Redis connection closed")


