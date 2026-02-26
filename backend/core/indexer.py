import os
import time
import json
import hashlib
import chromadb
from chromadb.utils import embedding_functions
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

class FastIndexer:
    def __init__(self, workspace_path: str, db_path: str = "./chroma_db", cache_file: str = ".fastindexer_cache.json"):
        self.workspace_path = workspace_path
        self.cache_file = os.path.join(workspace_path, cache_file)
        self.client = chromadb.PersistentClient(path=db_path)
        
        # Performance tuning
        self.max_workers = min(16, (os.cpu_count() or 1) * 2)
        
        # Caching dictionary
        self.cache = self.load_cache()
        
        # Exclusions/Inclusions mapping based on requirements
        self.excluded_dirs = {"chroma_db", "__pycache__", "node_modules", ".git", "venv", ".venv", "dist", "build"}
        self.excluded_exts = {".jpg", ".png", ".gif", ".ico", ".pdf", ".zip", ".exe", ".dll", ".so", ".dylib", ".bin", ".pyc", ".pyo"}
        self.included_exts = {".py", ".js", ".ts", ".jsx", ".tsx", ".html", ".css", ".scss", ".md", ".txt", ".json", ".yaml", ".yml", ".toml", ".ini", ".cfg", ".conf", ".xml", ".svg"}
        
        self.ef = embedding_functions.OllamaEmbeddingFunction(
            model_name="nomic-embed-text",
            url="http://localhost:11434/api/embeddings"
        )
        
        try:
            self.collection = self.client.get_or_create_collection(
                name="workspace_code",
                embedding_function=self.ef
            )
        except Exception as e:
            if "Embedding function conflict" in str(e):
                print("Embedding function conflict detected. Recreating collection...")
                self.client.delete_collection(name="workspace_code")
                self.collection = self.client.get_or_create_collection(
                    name="workspace_code",
                    embedding_function=self.ef
                )
            else:
                raise e

    def load_cache(self) -> dict:
        """Loads file metadata hash cache from disk."""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r') as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def save_cache(self):
        """Saves current cache dictionary to disk."""
        try:
            with open(self.cache_file, 'w') as f:
                json.dump(self.cache, f)
        except Exception as e:
            print(f"Failed to save cache: {e}")

    def _get_file_hash(self, file_path: str) -> str:
        """Generates a composite hash based on file modification time and size."""
        try:
            stat = os.stat(file_path)
            return f"{stat.st_mtime}_{stat.st_size}"
        except Exception:
            return ""

    def get_files(self) -> list:
        """Walks the directory efficiently and filters out files based on rules."""
        file_list = []
        for root, dirs, files in os.walk(self.workspace_path):
            dirs[:] = [d for d in dirs if d not in self.excluded_dirs]
            
            for file in files:
                path = Path(file)
                if path.suffix.lower() in self.excluded_exts:
                    continue
                    
                # Broad whitelist - strictly allow only mapped useful source code extensions + explicit exceptions
                if path.suffix.lower() in self.included_exts or path.name.lower() in {".env", ".gitignore", "dockerfile", "makefile"}:
                    file_list.append(os.path.join(root, file))
        return file_list

    def read_file(self, file_path: str) -> str:
        """Safely reads file contents handling encoding."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Skip binary files that slipped through extension checks
            return ""
        except Exception:
            return ""

    def _index_chunk(self, file_path: str, chunk: str, index: int):
        doc_id = f"{file_path}_{index}"
        try:
            self.collection.upsert(
                ids=[doc_id],
                documents=[chunk],
                metadatas=[{"path": file_path, "chunk_index": index}]
            )
            return True
        except Exception as e:
            return False

    def _process_file(self, file_path: str) -> tuple:
        """Worker function intended for multi-threading."""
        current_hash = self._get_file_hash(file_path)
        
        # Cache Hit - skip processing
        if file_path in self.cache and self.cache[file_path] == current_hash:
            return (file_path, "skipped", current_hash)
            
        content = self.read_file(file_path)
        if not content.strip():
            return (file_path, "error_or_empty", current_hash)

        # Basic chunking split by 2000 chars
        chunks = [content[i:i+2000] for i in range(0, len(content), 2000)]
        success = True
        
        for i, chunk in enumerate(chunks):
            if not self._index_chunk(file_path, chunk, i):
                success = False
                break
                
        if success:
            return (file_path, "indexed", current_hash)
        return (file_path, "error", current_hash)

    def index_parallel(self):
        """Discovers files and dispatches them to a thread pool."""
        print(f"Discovering files in {self.workspace_path}...")
        start_time = time.time()
        files = self.get_files()
        
        total_files = len(files)
        indexed_count = 0
        skipped_count = 0
        error_count = 0
        
        print(f"[FastIndexer] Found {total_files} files. Indexing with {self.max_workers} threads...")
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_file = {executor.submit(self._process_file, f): f for f in files}
            
            for index, future in enumerate(as_completed(future_to_file)):
                file_path = future_to_file[future]
                try:
                    fp, status, file_hash = future.result()
                    if status == "indexed":
                        indexed_count += 1
                        self.cache[fp] = file_hash
                    elif status == "skipped":
                        skipped_count += 1
                    else:
                        error_count += 1
                except Exception as exc:
                    print(f'{file_path} generated an exception: {exc}')
                    error_count += 1
                
                # Feedback loop
                if (index + 1) % max(1, total_files // 10) == 0 or (index + 1) == total_files:
                    elapsed = time.time() - start_time
                    percent = (index + 1) / total_files * 100
                    rate = (index + 1) / elapsed if elapsed > 0 else 0
                    print(f"Progress: [{index + 1}/{total_files}] ({percent:.1f}%) | "
                          f"Indexed: {indexed_count}, Skipped: {skipped_count}, "
                          f"Rate: {rate:.1f} files/sec")
        
        self.save_cache()
        end_time = time.time()
        
        print("\n--- Indexing Complete ---")
        print(f"Total time taken: {end_time - start_time:.2f} seconds")
        print(f"Files Indexed: {indexed_count}")
        print(f"Files Skipped (Cached): {skipped_count}")
        print(f"Files Error/Empty: {error_count}")

    def query(self, text: str, n_results: int = 5):
        return self.collection.query(
            query_texts=[text],
            n_results=n_results
        )

class WorkspaceWatchdog(FileSystemEventHandler):
    def __init__(self, indexer: FastIndexer):
        self.indexer = indexer

    def _sync_file(self, file_path):
        # A lightweight wrapper for single-file sync that doesn't trigger a full pool
        self.indexer._process_file(file_path)
        self.indexer.save_cache()

    def on_modified(self, event):
        if not event.is_directory:
            self._sync_file(event.src_path)

    def on_created(self, event):
        if not event.is_directory:
            self._sync_file(event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._sync_file(event.dest_path)

def start_indexing_service(workspace_path: str):
    try:
        indexer = FastIndexer(workspace_path)
        indexer.index_parallel()
        
        observer = Observer()
        handler = WorkspaceWatchdog(indexer)
        observer.schedule(handler, workspace_path, recursive=True)
        observer.start()
        return indexer, observer
    except Exception as e:
        print(f"Watchdog or Indexer startup failed: {e}")
        return None, None

if __name__ == "__main__":
    # Test run
    path = os.path.abspath("../../") # Project root
    indexer, observer = start_indexing_service(path)
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        if observer:
            observer.stop()
    if observer:
        observer.join()
