from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_, or_
from fastapi import HTTPException
from typing import List, Optional

from ..models.user import User, Team, team_members, DataSource
from ..models.team import TeamCreate, TeamUpdate, TeamInviteRequest, TeamMemberUpdate

class TeamService:
    async def create_team(self, db: Session, user_id: int, team: TeamCreate) -> Team:
        """Create a new team"""
        # Check if team name already exists
        existing_team = db.query(Team).filter(Team.name == team.name).first()
        if existing_team:
            raise HTTPException(status_code=400, detail="Team name already exists")
        
        # Create team
        db_team = Team(
            name=team.name,
            display_name=team.display_name,
            description=team.description,
            owner_id=user_id
        )
        
        try:
            db.add(db_team)
            db.commit()
            db.refresh(db_team)
            
            # Add owner as team member with owner role
            await self._add_team_member(db, db_team.id, user_id, "owner")
            
            return db_team
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Team creation failed")
    
    async def get_user_teams(self, db: Session, user_id: int) -> List[Team]:
        """Get all teams a user is a member of"""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return user.teams
    
    async def get_team_by_id(self, db: Session, team_id: int, user_id: int) -> Team:
        """Get team by ID if user is a member"""
        team = db.query(Team).filter(Team.id == team_id).first()
        if not team:
            raise HTTPException(status_code=404, detail="Team not found")
        
        # Check if user is a member
        if not await self._is_team_member(db, team_id, user_id):
            raise HTTPException(status_code=403, detail="Access denied")
        
        return team
    
    async def update_team(self, db: Session, team_id: int, user_id: int, team_update: TeamUpdate) -> Team:
        """Update team (only owner or admin can update)"""
        team = await self.get_team_by_id(db, team_id, user_id)
        
        # Check if user is owner or admin
        user_role = await self._get_user_role_in_team(db, team_id, user_id)
        if user_role not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Only team owners and admins can update team")
        
        update_data = team_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(team, field, value)
        
        try:
            db.commit()
            db.refresh(team)
            return team
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Update failed")
    
    async def delete_team(self, db: Session, team_id: int, user_id: int):
        """Delete team (only owner can delete)"""
        team = await self.get_team_by_id(db, team_id, user_id)
        
        if team.owner_id != user_id:
            raise HTTPException(status_code=403, detail="Only team owner can delete team")
        
        db.delete(team)
        db.commit()
    
    async def invite_user_to_team(self, db: Session, team_id: int, inviter_id: int, invite: TeamInviteRequest):
        """Invite user to team"""
        team = await self.get_team_by_id(db, team_id, inviter_id)
        
        # Check if inviter is owner or admin
        inviter_role = await self._get_user_role_in_team(db, team_id, inviter_id)
        if inviter_role not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Only team owners and admins can invite users")
        
        # Find user by email
        user = db.query(User).filter(User.email == invite.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if user is already a member
        if await self._is_team_member(db, team_id, user.id):
            raise HTTPException(status_code=400, detail="User is already a team member")
        
        # Add user to team
        await self._add_team_member(db, team_id, user.id, invite.role)
        
        return {"message": f"User {user.username} added to team"}
    
    async def remove_user_from_team(self, db: Session, team_id: int, remover_id: int, user_id: int):
        """Remove user from team"""
        team = await self.get_team_by_id(db, team_id, remover_id)
        
        # Check permissions
        remover_role = await self._get_user_role_in_team(db, team_id, remover_id)
        target_role = await self._get_user_role_in_team(db, team_id, user_id)
        
        # Owner can remove anyone, admin can remove members, users can remove themselves
        if not (remover_role == "owner" or 
                (remover_role == "admin" and target_role == "member") or
                remover_id == user_id):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Cannot remove team owner
        if target_role == "owner":
            raise HTTPException(status_code=400, detail="Cannot remove team owner")
        
        # Remove from team
        db.execute(
            team_members.delete().where(
                and_(team_members.c.team_id == team_id, team_members.c.user_id == user_id)
            )
        )
        db.commit()
        
        return {"message": "User removed from team"}
    
    async def update_team_member_role(self, db: Session, team_id: int, updater_id: int, user_id: int, role_update: TeamMemberUpdate):
        """Update team member role"""
        team = await self.get_team_by_id(db, team_id, updater_id)
        
        # Only owner can change roles
        if team.owner_id != updater_id:
            raise HTTPException(status_code=403, detail="Only team owner can change member roles")
        
        # Cannot change owner role
        target_role = await self._get_user_role_in_team(db, team_id, user_id)
        if target_role == "owner":
            raise HTTPException(status_code=400, detail="Cannot change owner role")
        
        # Update role
        db.execute(
            team_members.update().where(
                and_(team_members.c.team_id == team_id, team_members.c.user_id == user_id)
            ).values(role=role_update.role)
        )
        db.commit()
        
        return {"message": "Member role updated"}
    
    async def get_team_data_sources(self, db: Session, team_id: int, user_id: int) -> List[DataSource]:
        """Get team's data sources"""
        await self.get_team_by_id(db, team_id, user_id)  # Check access
        
        return db.query(DataSource).filter(DataSource.team_id == team_id).all()
    
    async def get_user_accessible_data_sources(self, db: Session, user_id: int) -> List[DataSource]:
        """Get all data sources accessible to user (personal + team sources)"""
        # Get personal data sources
        personal_sources = db.query(DataSource).filter(DataSource.user_id == user_id).all()
        
        # Get team data sources
        user = db.query(User).filter(User.id == user_id).first()
        team_sources = []
        if user and user.teams:
            team_ids = [team.id for team in user.teams]
            team_sources = db.query(DataSource).filter(DataSource.team_id.in_(team_ids)).all()
        
        return personal_sources + team_sources
    
    # Helper methods
    async def _is_team_member(self, db: Session, team_id: int, user_id: int) -> bool:
        """Check if user is a team member"""
        result = db.execute(
            team_members.select().where(
                and_(team_members.c.team_id == team_id, team_members.c.user_id == user_id)
            )
        ).first()
        return result is not None
    
    async def _get_user_role_in_team(self, db: Session, team_id: int, user_id: int) -> Optional[str]:
        """Get user's role in team"""
        result = db.execute(
            team_members.select().where(
                and_(team_members.c.team_id == team_id, team_members.c.user_id == user_id)
            )
        ).first()
        return result.role if result else None
    
    async def _add_team_member(self, db: Session, team_id: int, user_id: int, role: str):
        """Add user to team with specified role"""
        db.execute(
            team_members.insert().values(
                team_id=team_id,
                user_id=user_id,
                role=role
            )
        )
        db.commit()