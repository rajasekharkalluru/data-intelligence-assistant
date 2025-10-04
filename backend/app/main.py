from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
import os
from dotenv import load_dotenv

from .database import get_db, engine
from .models import user as user_models
from .models.auth import UserCreate, UserResponse, LoginRequest, Token
from .models.query import QueryRequest, QueryResponse
from .models.data_source import DataSourceCreate, DataSourceResponse, DataSourceUpdate, SyncResponse
from .models.team import TeamCreate, TeamResponse, TeamDetailResponse, TeamUpdate, TeamInviteRequest, TeamMemberUpdate
from .auth import authenticate_user, create_access_token, get_current_active_user, get_password_hash, ACCESS_TOKEN_EXPIRE_MINUTES
from .services.rag_service import RAGService
from .services.connector_service import ConnectorService
from .services.user_service import UserService
from .services.data_source_service import DataSourceService
from .services.team_service import TeamService
from .services.webhook_service import WebhookService
from .services.scheduler_service import scheduler

load_dotenv()

# Create database tables
user_models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Developer Intelligence Assistant API", version="1.0.0")

@app.on_event("startup")
async def startup_event():
    """Start background services"""
    await scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    """Stop background services"""
    await scheduler.stop()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
rag_service = RAGService()
connector_service = ConnectorService()
user_service = UserService()
data_source_service = DataSourceService()
team_service = TeamService()
webhook_service = WebhookService()

# Public routes
@app.get("/")
async def root():
    return {"message": "Developer Intelligence Assistant API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Authentication routes
@app.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    return await user_service.create_user(db, user)

@app.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login user and return access token"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
async def read_users_me(current_user: user_models.User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

# Chat Session Management
@app.get("/chat/sessions")
async def get_chat_sessions(
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's chat sessions"""
    sessions = db.query(user_models.ChatSession).filter(
        user_models.ChatSession.user_id == current_user.id
    ).order_by(user_models.ChatSession.updated_at.desc()).all()
    
    return [
        {
            "id": session.id,
            "title": session.title or "New Chat",
            "created_at": session.created_at,
            "updated_at": session.updated_at,
            "message_count": len(session.messages)
        }
        for session in sessions
    ]

@app.post("/chat/sessions")
async def create_chat_session(
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""
    session = user_models.ChatSession(
        user_id=current_user.id,
        title="New Chat"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
        "message_count": 0
    }

@app.get("/chat/sessions/{session_id}/messages")
async def get_session_messages(
    session_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get messages for a chat session"""
    # Verify session belongs to user
    session = db.query(user_models.ChatSession).filter(
        user_models.ChatSession.id == session_id,
        user_models.ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    messages = db.query(user_models.ChatMessage).filter(
        user_models.ChatMessage.session_id == session_id
    ).order_by(user_models.ChatMessage.created_at).all()
    
    return [
        {
            "id": msg.id,
            "type": msg.message_type,
            "content": msg.content,
            "sources": msg.sources_used,
            "timestamp": msg.created_at
        }
        for msg in messages
    ]

@app.put("/chat/sessions/{session_id}")
async def update_chat_session(
    session_id: int,
    title: str,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update chat session title"""
    session = db.query(user_models.ChatSession).filter(
        user_models.ChatSession.id == session_id,
        user_models.ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.title = title
    db.commit()
    
    return {"message": "Session updated successfully"}

@app.delete("/chat/sessions/{session_id}")
async def delete_chat_session(
    session_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session"""
    session = db.query(user_models.ChatSession).filter(
        user_models.ChatSession.id == session_id,
        user_models.ChatSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    db.delete(session)
    db.commit()
    
    return {"message": "Session deleted successfully"}

# AI Model Management
@app.get("/models")
async def get_available_models(
    current_user: user_models.User = Depends(get_current_active_user)
):
    """Get list of available AI models"""
    try:
        # Get models from Ollama
        import ollama
        models_response = ollama.list()
        models = [
            {
                "name": model['name'],
                "size": model.get('size', 0),
                "modified": model.get('modified_at', ''),
            }
            for model in models_response.get('models', [])
        ]
        return {"models": models}
    except Exception as e:
        # Return default if Ollama not available
        return {"models": [{"name": "llama3.2", "size": 0, "modified": ""}]}

# Protected routes
@app.post("/query", response_model=QueryResponse)
async def query_knowledge_base(
    request: QueryRequest,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Query the knowledge base using RAG with chat history context"""
    try:
        # Save user message to session if session_id provided
        if request.session_id:
            user_message = user_models.ChatMessage(
                session_id=request.session_id,
                message_type='user',
                content=request.question
            )
            db.add(user_message)
            db.commit()
        
        response = await rag_service.query(
            user_id=current_user.id,
            question=request.question,
            sources=request.sources,
            response_type=request.response_type,
            temperature=request.temperature,
            session_id=request.session_id,
            model=request.model,
            db=db
        )
        
        # Save assistant response to session
        if request.session_id:
            assistant_message = user_models.ChatMessage(
                session_id=request.session_id,
                message_type='assistant',
                content=response.answer,
                sources_used={"sources": [s.dict() for s in response.sources]},
                response_type=request.response_type.value,
                temperature=str(request.temperature),
                processing_time=str(response.processing_time)
            )
            db.add(assistant_message)
            db.commit()
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/data-sources", response_model=list[DataSourceResponse])
async def get_user_data_sources(
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's configured data sources"""
    return await data_source_service.get_user_data_sources(db, current_user.id)

@app.post("/data-sources", response_model=DataSourceResponse)
async def create_data_source(
    data_source: DataSourceCreate,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new data source configuration"""
    return await data_source_service.create_data_source(db, current_user.id, data_source)

@app.put("/data-sources/{source_id}", response_model=DataSourceResponse)
async def update_data_source(
    source_id: int,
    data_source: DataSourceUpdate,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a data source configuration"""
    return await data_source_service.update_data_source(db, current_user.id, source_id, data_source)

@app.delete("/data-sources/{source_id}")
async def delete_data_source(
    source_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a data source configuration"""
    await data_source_service.delete_data_source(db, current_user.id, source_id)
    return {"message": "Data source deleted successfully"}

@app.post("/data-sources/{source_id}/sync", response_model=SyncResponse)
async def sync_data_source(
    source_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Trigger data sync for a specific source"""
    return await data_source_service.sync_data_source(db, current_user.id, source_id)

@app.post("/data-sources/{source_id}/test")
async def test_data_source_connection(
    source_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Test connection to a data source"""
    result = await data_source_service.test_connection(db, current_user.id, source_id)
    return {"status": "success" if result else "failed", "connected": result}

@app.get("/data-sources/{source_id}/sync-history")
async def get_sync_history(
    source_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get sync history for a data source"""
    # Verify access to data source
    await data_source_service.get_data_source(db, current_user.id, source_id)
    
    # Get sync logs
    from .models.document import SyncLog
    sync_logs = db.query(SyncLog).filter(
        SyncLog.data_source_id == source_id
    ).order_by(SyncLog.started_at.desc()).limit(20).all()
    
    return [
        {
            "id": log.id,
            "sync_strategy": log.sync_strategy,
            "sync_status": log.sync_status,
            "documents_processed": log.documents_processed,
            "documents_added": log.documents_added,
            "documents_updated": log.documents_updated,
            "documents_deleted": log.documents_deleted,
            "started_at": log.started_at,
            "completed_at": log.completed_at,
            "processing_time": log.processing_time,
            "next_sync_at": log.next_sync_at,
            "error_message": log.error_message
        }
        for log in sync_logs
    ]

# Team routes
@app.get("/teams", response_model=list[TeamResponse])
async def get_user_teams(
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's teams"""
    teams = await team_service.get_user_teams(db, current_user.id)
    
    # Add member and data source counts
    team_responses = []
    for team in teams:
        team_dict = {
            "id": team.id,
            "name": team.name,
            "display_name": team.display_name,
            "description": team.description,
            "owner_id": team.owner_id,
            "is_active": team.is_active,
            "created_at": team.created_at,
            "updated_at": team.updated_at,
            "member_count": len(team.members),
            "data_source_count": len(team.data_sources)
        }
        team_responses.append(TeamResponse(**team_dict))
    
    return team_responses

@app.post("/teams", response_model=TeamResponse)
async def create_team(
    team: TeamCreate,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new team"""
    db_team = await team_service.create_team(db, current_user.id, team)
    return TeamResponse(
        id=db_team.id,
        name=db_team.name,
        display_name=db_team.display_name,
        description=db_team.description,
        owner_id=db_team.owner_id,
        is_active=db_team.is_active,
        created_at=db_team.created_at,
        updated_at=db_team.updated_at,
        member_count=1,
        data_source_count=0
    )

@app.get("/teams/{team_id}", response_model=TeamDetailResponse)
async def get_team_details(
    team_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get team details with members"""
    team = await team_service.get_team_by_id(db, team_id, current_user.id)
    
    # Get team members with roles
    members = []
    for member in team.members:
        role = await team_service._get_user_role_in_team(db, team_id, member.id)
        # Get join date
        result = db.execute(
            team_service.team_members.select().where(
                team_service.team_members.c.team_id == team_id and 
                team_service.team_members.c.user_id == member.id
            )
        ).first()
        
        members.append({
            "id": member.id,
            "username": member.username,
            "full_name": member.full_name,
            "email": member.email,
            "role": role,
            "joined_at": result.joined_at if result else team.created_at
        })
    
    return TeamDetailResponse(
        id=team.id,
        name=team.name,
        display_name=team.display_name,
        description=team.description,
        owner_id=team.owner_id,
        is_active=team.is_active,
        created_at=team.created_at,
        updated_at=team.updated_at,
        member_count=len(team.members),
        data_source_count=len(team.data_sources),
        members=members
    )

@app.put("/teams/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: int,
    team_update: TeamUpdate,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update team"""
    db_team = await team_service.update_team(db, team_id, current_user.id, team_update)
    return TeamResponse(
        id=db_team.id,
        name=db_team.name,
        display_name=db_team.display_name,
        description=db_team.description,
        owner_id=db_team.owner_id,
        is_active=db_team.is_active,
        created_at=db_team.created_at,
        updated_at=db_team.updated_at,
        member_count=len(db_team.members),
        data_source_count=len(db_team.data_sources)
    )

@app.delete("/teams/{team_id}")
async def delete_team(
    team_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete team"""
    await team_service.delete_team(db, team_id, current_user.id)
    return {"message": "Team deleted successfully"}

@app.post("/teams/{team_id}/invite")
async def invite_user_to_team(
    team_id: int,
    invite: TeamInviteRequest,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Invite user to team"""
    return await team_service.invite_user_to_team(db, team_id, current_user.id, invite)

@app.delete("/teams/{team_id}/members/{user_id}")
async def remove_team_member(
    team_id: int,
    user_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove user from team"""
    return await team_service.remove_user_from_team(db, team_id, current_user.id, user_id)

@app.put("/teams/{team_id}/members/{user_id}/role")
async def update_team_member_role(
    team_id: int,
    user_id: int,
    role_update: TeamMemberUpdate,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update team member role"""
    return await team_service.update_team_member_role(db, team_id, current_user.id, user_id, role_update)

@app.get("/teams/{team_id}/data-sources", response_model=list[DataSourceResponse])
async def get_team_data_sources(
    team_id: int,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get team's data sources"""
    return await team_service.get_team_data_sources(db, team_id, current_user.id)

@app.post("/teams/{team_id}/data-sources", response_model=DataSourceResponse)
async def create_team_data_source(
    team_id: int,
    data_source: DataSourceCreate,
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a team data source"""
    return await data_source_service.create_team_data_source(db, current_user.id, team_id, data_source)

# Webhook endpoints (public, no authentication required)
@app.post("/webhooks/confluence")
async def confluence_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Confluence webhook events"""
    try:
        payload = await request.json()
        signature = request.headers.get("X-Hub-Signature-256", "")
        
        result = await webhook_service.handle_confluence_webhook(db, payload, signature)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/webhooks/jira")
async def jira_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle JIRA webhook events"""
    try:
        payload = await request.json()
        signature = request.headers.get("X-Hub-Signature-256", "")
        
        result = await webhook_service.handle_jira_webhook(db, payload, signature)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/webhooks/bitbucket")
async def bitbucket_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Bitbucket webhook events"""
    try:
        payload = await request.json()
        signature = request.headers.get("X-Hub-Signature-256", "")
        
        result = await webhook_service.handle_bitbucket_webhook(db, payload, signature)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Analytics
@app.get("/analytics/stats")
async def get_analytics_stats(
    current_user: user_models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get analytics statistics for the current user"""
    from sqlalchemy import func
    
    # Count total messages
    total_messages = db.query(func.count(user_models.ChatMessage.id)).filter(
        user_models.ChatMessage.session_id.in_(
            db.query(user_models.ChatSession.id).filter(
                user_models.ChatSession.user_id == current_user.id
            )
        )
    ).scalar() or 0
    
    # Count total sessions
    total_sessions = db.query(func.count(user_models.ChatSession.id)).filter(
        user_models.ChatSession.user_id == current_user.id
    ).scalar() or 0
    
    # Count active sources
    active_sources = db.query(func.count(user_models.DataSource.id)).filter(
        user_models.DataSource.user_id == current_user.id,
        user_models.DataSource.is_active == True
    ).scalar() or 0
    
    # Get recent queries (last 10)
    recent_messages = db.query(user_models.ChatMessage).filter(
        user_models.ChatMessage.type == 'user',
        user_models.ChatMessage.session_id.in_(
            db.query(user_models.ChatSession.id).filter(
                user_models.ChatSession.user_id == current_user.id
            )
        )
    ).order_by(user_models.ChatMessage.timestamp.desc()).limit(10).all()
    
    recent_queries = [
        {
            'text': msg.content[:100] + ('...' if len(msg.content) > 100 else ''),
            'timestamp': msg.timestamp.isoformat()
        }
        for msg in recent_messages
    ]
    
    # Source usage (mock data for now - would need to track this in messages)
    sources = db.query(user_models.DataSource).filter(
        user_models.DataSource.user_id == current_user.id,
        user_models.DataSource.is_active == True
    ).all()
    
    source_usage = [
        {
            'name': source.display_name,
            'count': 0  # Would need to track actual usage
        }
        for source in sources
    ]
    
    return {
        'totalMessages': total_messages,
        'totalSessions': total_sessions,
        'activeSources': active_sources,
        'avgResponseTime': 1.2,  # Mock data
        'recentQueries': recent_queries,
        'sourceUsage': source_usage
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)