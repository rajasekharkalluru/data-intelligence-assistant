import time
import os
from typing import List, Optional
import chromadb
from sentence_transformers import SentenceTransformer
import ollama

from ..models.query import QueryResponse, SourceReference, ResponseType

class RAGService:
    def __init__(self):
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        self.chroma_client = chromadb.PersistentClient(path="./data/chroma_db")
        self.collection = self.chroma_client.get_or_create_collection(
            name="developer_knowledge",
            metadata={"hnsw:space": "cosine"}
        )
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.2")
    
    async def query(self, user_id: int, question: str, sources: Optional[List[str]] = None, 
                   response_type: ResponseType = ResponseType.CONCISE, 
                   temperature: float = 0.7, db=None) -> QueryResponse:
        start_time = time.time()
        
        # Generate embedding for the question
        question_embedding = self.embedding_model.encode([question]).tolist()[0]
        
        # Build where clause for user + team accessible data
        from .team_service import TeamService
        team_service = TeamService()
        
        # Get user's team IDs
        user_teams = await team_service.get_user_teams(db, user_id)
        team_ids = [team.id for team in user_teams]
        
        # Build OR condition for user data OR team data
        where_conditions = []
        
        # User's personal data
        user_condition = {"user_id": user_id}
        if sources:
            user_condition["source"] = {"$in": sources}
        where_conditions.append(user_condition)
        
        # Team data
        if team_ids:
            team_condition = {"team_id": {"$in": team_ids}}
            if sources:
                team_condition["source"] = {"$in": sources}
            where_conditions.append(team_condition)
        
        # Search in vector database with OR condition
        all_results = []
        for condition in where_conditions:
            try:
                results = self.collection.query(
                    query_embeddings=[question_embedding],
                    n_results=5,  # Get fewer from each to total 10
                    where=condition
                )
                if results['documents'][0]:  # Check if results exist
                    all_results.extend(zip(
                        results['documents'][0],
                        results['metadatas'][0],
                        results['distances'][0]
                    ))
            except Exception:
                continue  # Skip if no results for this condition
        
        # Sort by distance and take top 10
        all_results.sort(key=lambda x: x[2])  # Sort by distance
        all_results = all_results[:10]
        
        # Reconstruct search_results format
        if all_results:
            search_results = {
                'documents': [[result[0] for result in all_results]],
                'metadatas': [[result[1] for result in all_results]],
                'distances': [[result[2] for result in all_results]]
            }
        else:
            search_results = {
                'documents': [[]],
                'metadatas': [[]],
                'distances': [[]]
            }
        
        # Prepare context from search results
        context_docs = []
        source_refs = []
        
        for i, (doc, metadata, distance) in enumerate(zip(
            search_results['documents'][0],
            search_results['metadatas'][0], 
            search_results['distances'][0]
        )):
            context_docs.append(doc)
            source_refs.append(SourceReference(
                title=metadata.get('title', 'Unknown'),
                url=metadata.get('url', ''),
                source_type=metadata.get('source', 'unknown'),
                snippet=doc[:200] + "..." if len(doc) > 200 else doc,
                confidence=1 - distance  # Convert distance to confidence
            ))
        
        # Generate response using Ollama
        context = "\n\n".join(context_docs[:5])  # Use top 5 results
        prompt = self._build_prompt(question, context, response_type)
        
        try:
            response = ollama.generate(
                model=self.ollama_model,
                prompt=prompt,
                options={"temperature": temperature}
            )
            answer = response['response']
        except Exception as e:
            answer = f"Error generating response: {str(e)}"
        
        processing_time = time.time() - start_time
        
        return QueryResponse(
            answer=answer,
            sources=source_refs[:5],  # Return top 5 sources
            response_type=response_type,
            processing_time=processing_time
        )
    
    def _build_prompt(self, question: str, context: str, response_type: ResponseType) -> str:
        response_instructions = {
            ResponseType.BRIEF: "Provide a brief, direct answer in 1-2 sentences.",
            ResponseType.CONCISE: "Provide a clear, concise answer with key details.",
            ResponseType.EXPANSIVE: "Provide a comprehensive, detailed answer with examples and context."
        }
        
        return f"""Based on the following context, answer the question.

Context:
{context}

Question: {question}

Instructions: {response_instructions[response_type]}

Answer:"""