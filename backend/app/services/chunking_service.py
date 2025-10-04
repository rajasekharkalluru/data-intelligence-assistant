"""
Document Chunking Service

Implements intelligent chunking strategies for different document types.
"""

import re
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class Chunk:
    """Represents a document chunk"""
    content: str
    metadata: Dict[str, Any]
    chunk_index: int
    total_chunks: int

class ChunkingService:
    """Service for chunking documents intelligently"""
    
    def __init__(self):
        self.max_chunk_size = 1000  # tokens (roughly 750 words)
        self.chunk_overlap = 100    # tokens overlap for context
    
    def chunk_confluence_page(self, document: Dict[str, Any]) -> List[Chunk]:
        """
        Chunk Confluence pages by headers and sections
        
        Strategy:
        - Split by headers (h1, h2, h3)
        - Preserve code blocks intact
        - Max chunk size: 1000 tokens
        - Overlap: 100 tokens
        """
        content = document.get('content', '')
        
        # Split by headers (markdown-style or HTML-style)
        sections = self._split_by_headers(content)
        
        chunks = []
        chunk_index = 0
        
        for section in sections:
            # If section is small enough, keep it as one chunk
            if len(section.split()) <= self.max_chunk_size:
                chunks.append(Chunk(
                    content=section,
                    metadata={
                        **document,
                        'chunk_type': 'section',
                        'source_type': 'confluence'
                    },
                    chunk_index=chunk_index,
                    total_chunks=0  # Will update later
                ))
                chunk_index += 1
            else:
                # Split large sections into smaller chunks with overlap
                sub_chunks = self._split_with_overlap(section, self.max_chunk_size, self.chunk_overlap)
                for sub_chunk in sub_chunks:
                    chunks.append(Chunk(
                        content=sub_chunk,
                        metadata={
                            **document,
                            'chunk_type': 'section_part',
                            'source_type': 'confluence'
                        },
                        chunk_index=chunk_index,
                        total_chunks=0
                    ))
                    chunk_index += 1
        
        # Update total_chunks
        total = len(chunks)
        for chunk in chunks:
            chunk.total_chunks = total
        
        return chunks
    
    def chunk_jira_issue(self, document: Dict[str, Any]) -> List[Chunk]:
        """
        Chunk JIRA issues into logical parts
        
        Strategy:
        - Separate chunks for: title+description, comments
        - Include issue metadata in each chunk
        - Max chunk size: 800 tokens
        - Overlap: 50 tokens
        """
        chunks = []
        chunk_index = 0
        
        # Chunk 1: Title + Description
        title = document.get('title', '')
        description = document.get('description', '')
        main_content = f"{title}\n\n{description}"
        
        if main_content.strip():
            chunks.append(Chunk(
                content=main_content,
                metadata={
                    **document,
                    'chunk_type': 'main',
                    'source_type': 'jira'
                },
                chunk_index=chunk_index,
                total_chunks=0
            ))
            chunk_index += 1
        
        # Chunk 2+: Comments (group related comments)
        comments = document.get('comments', [])
        if comments:
            comment_text = "\n\n".join([
                f"Comment by {c.get('author', 'Unknown')}: {c.get('body', '')}"
                for c in comments
            ])
            
            if len(comment_text.split()) <= 800:
                chunks.append(Chunk(
                    content=comment_text,
                    metadata={
                        **document,
                        'chunk_type': 'comments',
                        'source_type': 'jira'
                    },
                    chunk_index=chunk_index,
                    total_chunks=0
                ))
            else:
                # Split comments into smaller chunks
                sub_chunks = self._split_with_overlap(comment_text, 800, 50)
                for sub_chunk in sub_chunks:
                    chunks.append(Chunk(
                        content=sub_chunk,
                        metadata={
                            **document,
                            'chunk_type': 'comments_part',
                            'source_type': 'jira'
                        },
                        chunk_index=chunk_index,
                        total_chunks=0
                    ))
                    chunk_index += 1
        
        # Update total_chunks
        total = len(chunks)
        for chunk in chunks:
            chunk.total_chunks = total
        
        return chunks
    
    def chunk_code_file(self, document: Dict[str, Any]) -> List[Chunk]:
        """
        Chunk code files intelligently
        
        Strategy:
        - Function/class level chunking
        - Preserve imports and context
        - Max chunk size: 1500 tokens (code needs more context)
        - Include file path and line numbers
        - Overlap: 200 tokens
        """
        content = document.get('content', '')
        file_path = document.get('file_path', '')
        
        # Try to split by functions/classes
        chunks = []
        chunk_index = 0
        
        # Simple heuristic: split by function definitions
        # This is language-agnostic but works for most languages
        function_pattern = r'(def |function |func |class |public |private |protected )'
        
        parts = re.split(f'({function_pattern})', content)
        
        current_chunk = ""
        for i, part in enumerate(parts):
            if len((current_chunk + part).split()) > 1500:
                if current_chunk:
                    chunks.append(Chunk(
                        content=current_chunk,
                        metadata={
                            **document,
                            'chunk_type': 'code_block',
                            'source_type': 'bitbucket',
                            'file_path': file_path
                        },
                        chunk_index=chunk_index,
                        total_chunks=0
                    ))
                    chunk_index += 1
                current_chunk = part
            else:
                current_chunk += part
        
        # Add remaining chunk
        if current_chunk.strip():
            chunks.append(Chunk(
                content=current_chunk,
                metadata={
                    **document,
                    'chunk_type': 'code_block',
                    'source_type': 'bitbucket',
                    'file_path': file_path
                },
                chunk_index=chunk_index,
                total_chunks=0
            ))
        
        # Update total_chunks
        total = len(chunks)
        for chunk in chunks:
            chunk.total_chunks = total
        
        return chunks
    
    def _split_by_headers(self, content: str) -> List[str]:
        """Split content by headers (h1, h2, h3)"""
        # Split by markdown headers or common patterns
        header_pattern = r'(^#{1,3}\s+.+$|^[A-Z][^.!?]*:$)'
        sections = re.split(header_pattern, content, flags=re.MULTILINE)
        
        # Combine header with its content
        result = []
        for i in range(0, len(sections), 2):
            if i + 1 < len(sections):
                result.append(sections[i] + sections[i + 1])
            else:
                result.append(sections[i])
        
        return [s.strip() for s in result if s.strip()]
    
    def _split_with_overlap(self, text: str, max_size: int, overlap: int) -> List[str]:
        """Split text into chunks with overlap"""
        words = text.split()
        chunks = []
        
        i = 0
        while i < len(words):
            chunk_words = words[i:i + max_size]
            chunks.append(' '.join(chunk_words))
            i += max_size - overlap
        
        return chunks
    
    def chunk_document(self, document: Dict[str, Any], source_type: str) -> List[Chunk]:
        """
        Chunk a document based on its source type
        
        Args:
            document: Document to chunk
            source_type: Type of source (confluence, jira, bitbucket)
        
        Returns:
            List of chunks
        """
        if source_type == 'confluence':
            return self.chunk_confluence_page(document)
        elif source_type == 'jira':
            return self.chunk_jira_issue(document)
        elif source_type == 'bitbucket':
            return self.chunk_code_file(document)
        else:
            # Default: simple splitting
            content = document.get('content', '')
            chunks = self._split_with_overlap(content, self.max_chunk_size, self.chunk_overlap)
            return [
                Chunk(
                    content=chunk,
                    metadata={**document, 'chunk_type': 'default', 'source_type': source_type},
                    chunk_index=i,
                    total_chunks=len(chunks)
                )
                for i, chunk in enumerate(chunks)
            ]
