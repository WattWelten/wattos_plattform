"""
File Watcher
Überwacht Dateisystem auf neue/geänderte Dokumente
"""
import asyncio
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler, FileSystemEvent
from typing import Optional, Set
import logging

logger = logging.getLogger(__name__)


class DocumentEventHandler(FileSystemEventHandler):
    """Event Handler für Dokument-Änderungen"""

    def __init__(self, processor):
        self.processor = processor
        super().__init__()

    def on_created(self, event: FileSystemEvent):
        """Neue Datei erstellt"""
        if not event.is_directory:
            asyncio.create_task(self.processor.handle_file(event.src_path))

    def on_modified(self, event: FileSystemEvent):
        """Datei geändert"""
        if not event.is_directory:
            asyncio.create_task(self.processor.handle_file(event.src_path))


class FileWatcher:
    """File Watcher Service"""

    def __init__(self, processor):
        self.processor = processor
        self.observer: Optional[Observer] = None
        self.watch_paths: Set[str] = set()
        self.event_handler = DocumentEventHandler(processor)

    def start(self):
        """Watcher starten"""
        if self.observer and self.observer.is_alive():
            logger.warning("File watcher already running")
            return

        self.observer = Observer()
        self.observer.start()
        logger.info("File watcher started")

    def stop(self):
        """Watcher stoppen"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            logger.info("File watcher stopped")

    def add_watch_path(self, path: str):
        """Pfad zum Überwachen hinzufügen"""
        path_obj = Path(path)
        if not path_obj.exists():
            logger.warning(f"Watch path does not exist: {path}")
            return

        if path in self.watch_paths:
            logger.warning(f"Path already being watched: {path}")
            return

        if self.observer:
            self.observer.schedule(self.event_handler, path, recursive=True)
            self.watch_paths.add(path)
            logger.info(f"Started watching path: {path}")

    def remove_watch_path(self, path: str):
        """Pfad aus Überwachung entfernen"""
        if path not in self.watch_paths:
            logger.warning(f"Path not being watched: {path}")
            return

        # Observer unterstützt kein direktes Entfernen, daher neu starten
        if self.observer:
            self.observer.stop()
            self.observer.join()

            self.watch_paths.remove(path)

            # Neu starten mit verbleibenden Pfaden
            self.observer = Observer()
            for watch_path in self.watch_paths:
                self.observer.schedule(self.event_handler, watch_path, recursive=True)
            self.observer.start()

            logger.info(f"Stopped watching path: {path}")


