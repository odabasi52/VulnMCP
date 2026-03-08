"""
File operations service
"""

import aiofiles
from typing import List, Optional
from models.data_models import Document
from config import DOCUMENTS_DIR, IS_VULNERABLE, ALLOWED_FILE_EXTENSIONS
import re

class FileService:
    """Handle file operations"""

    @staticmethod
    def is_path_traversal(path: str) -> bool:
        pattern = re.compile(r'(^|[\\/])\.\.([\\/]|$)')
        return bool(pattern.search(path))
    
    @staticmethod
    async def list_documents(path: str = None) -> List[Document]:
        """List all documents in the documents directory or specified path
        
        Args:
            path: Optional subdirectory path relative to DOCUMENTS_DIR
        
        Returns:
            List of Document objects
            
        Raises:
            ValueError: If path is invalid or path traversal is detected
        """
        documents = []
        if path:
            target_dir = DOCUMENTS_DIR / path
        else:
            target_dir = DOCUMENTS_DIR
        if IS_VULNERABLE:
            try:
                target_dir = target_dir.resolve()
            except (ValueError, RuntimeError) as e:
                raise ValueError("Invalid path resolution") from e
            
            if not target_dir.exists():
                raise ValueError("Directory not found")
            
            for file_path in target_dir.glob("*"):
                if file_path.is_file():
                    # For files, don't read content - just list metadata
                    doc = Document(
                        id=file_path.stem,
                        name=file_path.name,
                        path=str(file_path),
                        content="[File]",
                        size=file_path.stat().st_size,
                        mime_type=f"text/{file_path.suffix[1:]}",
                        type="file"
                    )
                    documents.append(doc)
                elif file_path.is_dir():
                    # Add directory as a document-like object
                    doc = Document(
                        id=file_path.name,
                        name=file_path.name,
                        path=str(file_path),
                        content="[Directory]",
                        size=0,
                        mime_type="application/directory",
                        type="directory"
                    )
                    documents.append(doc)
        else:
            
            # Verify path exists and is within DOCUMENTS_DIR
            try:
                target_dir = target_dir.resolve()
            except (ValueError, RuntimeError) as e:
                raise ValueError("Invalid path resolution") from e
            
            if not target_dir.exists():
                raise ValueError("Directory not found")
            
            if FileService.is_path_traversal(str(target_dir)) or not target_dir.is_relative_to(DOCUMENTS_DIR.resolve()):
                raise ValueError("Path traversal detected")
            
            for file_path in target_dir.glob("*"):
                if file_path.is_file():
                    # For files, don't read content - just list metadata
                    doc = Document(
                        id=file_path.stem,
                        name=file_path.name,
                        path=str(file_path),
                        content="[File]",
                        size=file_path.stat().st_size,
                        mime_type=f"text/{file_path.suffix[1:]}",
                        type="file"
                    )
                    documents.append(doc)
                elif file_path.is_dir():
                    # Add directory as a document-like object
                    doc = Document(
                        id=file_path.name,
                        name=file_path.name,
                        path=str(file_path),
                        content="[Directory]",
                        size=0,
                        mime_type="application/directory",
                        type="directory"
                    )
                    documents.append(doc)
        return documents
    
    @staticmethod
    async def read_document(document_name: str) -> Optional[str]:
        """Read full document content
        
        Args:
            document_name: Name of the document to read
            
        Returns:
            Document content as string
            
        Raises:
            FileNotFoundError: If file does not exist
            ValueError: If path traversal is detected or file type is unsupported
            IOError: If file cannot be read
        """
        file_path = DOCUMENTS_DIR / document_name      
        if not file_path.exists():
            raise FileNotFoundError("File not found")
        
        if IS_VULNERABLE:
            try:
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    content = await f.read(200)
                return content
            except Exception as e:
                raise IOError(f"Failed to read file: {str(e)}") from e
        else:
            file_path = file_path.resolve()
            if FileService.is_path_traversal(str(file_path)) or not file_path.is_relative_to(DOCUMENTS_DIR.resolve()):
                raise ValueError("Path traversal detected")
            
            if ALLOWED_FILE_EXTENSIONS.count(file_path.suffix) == 0:
                raise ValueError("Unsupported file type")

            try:
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    content = await f.read(200)
                return content
            except Exception as e:
                raise IOError(f"Failed to read file: {str(e)}") from e